const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
const scrapeSeller = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  try {
    const response = await Crawler.getSiteInfo(url);

    await Crawler.initBrowser();
    return {
      data: response,
      error: null,
    };
  } catch (e) {
    await Crawler.initBrowser();
    console.log(e);
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
  const prompts = [
    url +
      "\nQ: Is web page with above url for only one bait product? Please answer with 'Yes' or 'No'\nA:",
  ];
  let isProductPage = false;
  for (const prompt of prompts) {
    try {
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 2000,
        n: 1,
        prompt: prompt,
      });

      const answer = completion.data.choices[0].text.trim();
      if (answer.includes("Yes")) {
        isProductPage = true;
        break;
      }
    } catch (e) {
      consinue;
    }
  }
  return isProductPage;
};

const filterProductURL = async (Crawler, urlList) => {
  let ans = [];
  for (let i = 0; i < urlList.length; i++) {
    const check = await checkOneProductPage(Crawler, urlList[i]);
    console.log("---->", urlList[i], check);
    if (check) ans.push(urlList[i]);
  }
  console.log("=====>");
  console.log(ans);
  return ans;
};

const getProductList = async (url, step) => {
  const Crawler = new CrawlerService();
  try {
    await Crawler.init();
    let urlList = [];
    await Crawler.visitAll(url, step, urlList);
    console.log(urlList);
    const productUrlList = await filterProductURL(Crawler, urlList);
    console.log("FINISH");
    await Crawler.initBrowser();
    return {
      data: productUrlList,
      error: null,
    };
  } catch (e) {
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
    const {data, error} = await getProductList(url, 5);
    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully scrape urllist of all pages", data);
  },
};
