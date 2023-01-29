const puppeteer = require("puppeteer-extra");
const makerList = require("../config/maker.json");
const {convertToSlug} = require("../helper");
const socialList = require("../config/social.json");
const rssList = require("../config/rss-feed.json");

const config = {
  width: 1800,
  height: 800,
  headless: true,
  timeout: 120000,
  ignoreHTTPSErrors: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  args: [],
};

/**
 * Class to crawl baits from the sites
 */
class CrawlerService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  init = async () => {
    await this.initBrowser();
    await this.launchBrowser();
    this.page = await this.openNewPage();
  };

  //init Chromium browser
  initBrowser = async () => {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
        console.log("Error occured when close chromium: ", e);
      }
    }
  };

  //launch Chromium broser
  launchBrowser = async () => {
    try {
      this.browser = await puppeteer.launch(config);
    } catch (e) {
      console.log("Error occured when launching chromium: ", e);
    }
  };

  //visit website with url
  visitPage = async (page, url) => {
    try {
      await page.goto(url, {waitUntil: "domcontentloaded"});
    } catch (e) {
      console.log("Error when visit new page: ", e);
    }
  };

  //open blank page
  openNewPage = async () => {
    try {
      return await this.browser.newPage();
    } catch (e) {
      console.log("Error when create new page: ", e);
    }
  };

  //get urls of each bait from the shop page.
  getUrlList = async (page, selector) => {
    try {
      const data = await page.$$eval(selector, (data) => data.map((x) => x.href));
      return data;
    } catch (e) {
      console.log("Error when get urls of baits from the page: ", e);
      return [];
    }
  };

  /**
   *
   * @param {chromium page object} page
   * @param {url of the page} url
   * @param {response schema and selector} data
   * @return {fetched data}
   */
  scrapeObject = async (page, url, data) => {
    try {
      await this.visitPage(page, url);
      let response = {
        isLive: false,
      };
      for (const [key, value] of Object.entries(data)) {
        if (key === "media") {
          response[key] = await page.$$eval(value, (data) =>
            data.map((x) => {
              return {
                type: 1,
                url: x.src.split("/v1/fill")[0],
                alt: x.alt,
              };
            })
          );
          continue;
        }
        response[key] = (
          await page.$$eval(value, (data) =>
            data.map((x) => {
              return x.innerText;
            })
          )
        )[0];
      }
      return response;
    } catch (e) {
      console.log("Error when scrape detailed data: ", e);
    }
  };

  //validate and format the response
  validResponse = (response) => {
    if (response.media)
      response.media.map((media) => {
        media.url = media.url.replace(" ", "");
      });
    return response;
  };

  //execute the scraping script
  execute = async () => {
    // iterate the maker list
    for (const {makerName, script} of makerList) {
      for (const scriptItem of script) {
        const {type} = scriptItem;
        switch (type) {
          case "visit":
            const {url} = scriptItem;
            await this.visitPage(this.page, url);
            break;
          case "getUrlList":
            const {selector, data} = scriptItem;
            const urlList = await this.getUrlList(this.page, selector);
            const baits = [];
            for (const url of urlList) {
              let response = await this.scrapeObject(this.page, url, data);
              response.url = this.page.url();
              response.slug = convertToSlug(response.name);
              response.maker_slug = convertToSlug(makerName);
              response = this.validResponse(response);
              baits.push(response);
            }
            return baits;
        }
      }
    }
  };

  //scrape data from site with selector and property
  getDataBySelector = async (page, selector, property = null) => {
    try {
      const response = await page.$eval(selector, (data, property) => data[property], property);
      return response;
    } catch (e) {
      return null;
    }
  };

  //get site info to build maker info
  getSiteInfo = async (maker) => {
    const {url} = maker;
    const newMaker = {
      id: maker.id,
      url: maker.url,
      name: maker.name,
      slug: maker.slug,
    };

    const avatarSelector = "link[rel*='icon']";
    const descSelector = "meta[name='description']";

    await this.visitPage(this.page, url);
    try {
      // get avatar link
      const avatarUrl = await this.getDataBySelector(this.page, avatarSelector, "href");
      // get description
      const description = await this.getDataBySelector(this.page, descSelector, "content");
      // get rss feed
      let rssFeed = "";
      for (const rss of rssList) {
        const response = await this.getDataBySelector(this.page, rss, "href");
        if (response !== "") {
          rssFeed = response;
          break;
        }
      }
      // get social urls
      const socialUrl = [];
      for (const [site, url] of Object.entries(socialList)) {
        const selector = `a[href*='${url}']`;
        const link = await this.getDataBySelector(this.page, selector, "href");
        socialUrl.push({
          url: link,
          type: site,
        });
      }
      newMaker.avatarUrl = avatarUrl;
      newMaker.description = description;
      newMaker.socials = socialUrl;
      newMaker.feed_url = rssFeed;
      return newMaker;
    } catch (e) {
      console.log("Cannot fetch information from the site");
      return maker;
    }
  };

  //get item
  getItems = async (maker) => {
    if (maker.id === 9) {
      const data = await this.execute();
      return data;
    }
    return null;
  };
}

module.exports = CrawlerService;