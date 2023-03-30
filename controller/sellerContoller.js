const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
const scrapeSeller = async (url) => {
  const Crawler = new CrawlerService();
  try {
    await Crawler.init();
    const response = await Crawler.getSiteInfo(url);

    await Crawler.initBrowser();
    return {
      data: response,
      error: null,
    };
  } catch (e) {
    console.log(e);
    await Crawler.initBrowser();
    return {
      data: null,
      error: e,
    };
  }
};

const checkOneProductPage = async (Crawler, url) => {
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: `This is the list of urls of webpage: ${url}`},
        {role: "user", content: "Please find bait product pages for sale from these urls. Please respond simply JSON data of list of urls  without any description or header. If you can't respond with []."},
      ],
    });
    const content = completion.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const filterProductURL = async (Crawler, urlList) => {
  const ans = await checkOneProductPage(Crawler, urlList);
  return ans;
};

const getProductList = async (url, step) => {
  const Crawler = new CrawlerService();
  try {
    await Crawler.init();
    let urlList = [];
    const checkUrl = await Crawler.visitPage(Crawler.page, url);
    if (checkUrl === false) throw "Url is not valid";
    await Crawler.visitAll(url, step, urlList);

    const productUrlList = await filterProductURL(Crawler, urlList);
    await Crawler.initBrowser();
    return {
      data: productUrlList,
      error: null,
    };
  } catch (e) {
    console.log(e);
    await Crawler.initBrowser();
    return {
      data: null,
      error: e,
    };
  }
};

module.exports = {
  fetch: async (req, res) => {
    const {url} = req.query;
    const {data, error} = await scrapeSeller(url);

    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully scrape data of seller", data);
  },
  productList: async (req, res) => {
    const {url} = req.query;
    const {data, error} = await getProductList(url, 10);
    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(
      res,
      200,
      `Successfully scrape ${data.length} bait products from the website`,
      data
    );
  },
};
