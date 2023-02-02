const {fetch} = require("../supabase/supbase");
const supabase = require("../supabase/anon");
const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");

const scrapeSellers = async (id = null) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  try {
    const makerResponse = await fetch(supabase, "makers", id);
    if (makerResponse.error) return {data: null, error: makerResponse.error};
    const makerList = makerResponse.data;
    const response = [];

    for (const maker of makerList) {
      const newMaker = await Crawler.getSiteInfo(maker);
      const items = await Crawler.getItems(maker);
      response.push({
        maker: newMaker,
        items: items,
      });
    }
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
  scrape: async (req, res) => {
    const {id} = req.query;
    if (id == null) return sendResponse(res, 400, "Error: seller id is not given");

    const {data, error} = await scrapeSellers(id);
    if (error) return sendResponse(res, 500, "Error: something wrong in scraping");
    return sendResponse(res, 200, "Successfully scraped seller info and items", data);
  },
  scrapeAll: async (req, res) => {
    const {data, error} = await scrapeSellers();
    if (error) return sendResponse(res, 500, "Error: something wrong in scraping");
    return sendResponse(res, 200, "Successfully scraped seller info and items", data);
  },
  scrapeSellers,
};
