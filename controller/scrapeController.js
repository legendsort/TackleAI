const {fetch} = require("../supabase/supbase");
const supabase = require("../supabase/anon");
const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");

const scrape = async (makerList) => {
  try {
    const Crawler = new CrawlerService();
    await Crawler.init();

    const response = [];

    for (const maker of makerList) {
      const newMaker = await Crawler.getSiteInfo(maker);

      response.push({
        maker: newMaker,
      });
    }
    await Crawler.initBrowser();
    return {
      status: "success",
      data: response,
    };
  } catch (e) {
    await Crawler.closeBrowser();
    console.log(e);
    return {
      status: "error",
      error: e,
    };
  }
};

module.exports = {
  scrape: async (req, res) => {
    const {id} = req.query;
    if (id == null) return sendResponse(res, 400, "Error: maker id is not given");
    const makerResponse = await fetch(supabase, "makers", id);
    if (makerResponse.error) return sendResponse(res, 500, error);
    if (makerResponse.data.length === 0) return sendResponse(res, 400, "No such maker to scrape");
    const makerList = makerResponse.data;
    const response = await scrape(makerList);
    if (response.status === "error")
      return sendResponse(res, 500, "Error: something wrong in scraping");

    return sendResponse(res, 200, "Successfully scraped maker info and items", response.data);
  },
  scrapeAll: async (req, res) => {
    const {id} = req.query;
    const {data, error} = await fetch(supabase, "items", id);
    if (error) {
      return res.status(500).json({
        message: error,
        data: data,
      });
    }
    return res.status(200).json({
      message: "Successfully fetched items",
      data: data,
    });
  },
};
