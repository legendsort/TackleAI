const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");

const scrapeDetail = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  try {
    const seller = await Crawler.getSiteInfo(url);
    const response = {
      product: seller,
    };

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

module.exports = {
  fetch: async (req, res) => {
    const {url} = req.query;
    const {data, error} = await scrapeDetail(url);

    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully fetched items", data);
  },
};
