const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");

const scrapeSeller = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  try {
    const seller = await Crawler.getSiteInfo(url);
    // const items = await Crawler.getItems(maker);
    const response = {
      seller: seller,
      // items: items,
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
    const {data, error} = await scrapeSeller(url);
    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully scrape data of seller", data);
  },
};
