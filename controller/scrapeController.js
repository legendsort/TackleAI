const {fetch} = require("../supabase/supbase");
const supabase = require("../supabase/anon");
const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");

const scrapeMakers = async (id = null) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  try {
    // console.log("-->", id);
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
    if (id == null) return sendResponse(res, 400, "Error: maker id is not given");

    const {data, error} = await scrapeMakers(id);
    if (error) return sendResponse(res, 500, "Error: something wrong in scraping");
    return sendResponse(res, 200, "Successfully scraped maker info and items", data);
  },
  scrapeAll: async (req, res) => {
    const {data, error} = await scrapeMakers();
    if (error) return sendResponse(res, 500, "Error: something wrong in scraping");
    return sendResponse(res, 200, "Successfully scraped maker info and items", data);
  },
  scrapeMakers,
};
