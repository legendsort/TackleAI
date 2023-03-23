const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
const scrapeSeller = async (url) => {
  try {
    console.loG("Service crete")
    const Crawler = new CrawlerService();
    console.log("INIG")
    await Crawler.init();
    console.log("start signinfo")
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
      "\nI gave you the list of urls\n" +
      "Question: Please find bait product pages for sale from these urls. please answer with JSON of list of urls" +
      "\n\nA: ",
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

      console.log("=====>", url, answer, JSON.parse(answer));
      return JSON.parse(answer);
      if (answer.includes("Yes")) {
        isProductPage = true;
        break;
      }
    } catch (e) {
      return [];
      continue;
    }
  }
  return isProductPage;
};

const filterProductURL = async (Crawler, urlList) => {
  const ans = await checkOneProductPage(Crawler, urlList);
  // let ans = [];
  // for (let i = 0; i < urlList.length; i++) {
  //   const check = await checkOneProductPage(Crawler, urlList[i]);
  //   // console.log("---->", urlList[i], check);
  //   if (check) ans.push(urlList[i]);
  // }
  // console.log("=====>");
  // console.log(ans);
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
    console.log(urlList);

    const productUrlList = await filterProductURL(Crawler, urlList);
    console.log("FINISH");
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
    console.log(url);
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
