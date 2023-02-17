const puppeteer = require("puppeteer-extra");
const makerList = require("../config/maker.json");
const {convertToSlug} = require("../helper");
const socialList = require("../config/social.json");
const rssList = require("../config/rss-feed.json");

const config = {
  width: 1800,
  height: 800,
  headless: false,
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
  isSameDomain = async (url1, url2) => {
    try {
      const u1 = new URL(url1);
      const u2 = new URL(url2);
      return u1.hostname === u2.hostname;
    } catch (err) {
      return false;
    }
  };

  getAllUrl = async (url, page) => {
    const hrefs = await page.$$eval("a", (as) => as.map((a) => a.href.split("#")[0]));

    const realLink = [];
    for (const link of hrefs) {
      if (await this.isSameDomain(url, link)) realLink.push(link);
    }
    return realLink;
  };

  visitAll = async (url, step, ans) => {
    if (ans.includes(url)) return;
    await this.visitPage(this.page, url);
    url = this.page.url();
    if (ans.includes(url)) return;

    ans.push(url);
    if (step == 0) return;
    const hrefs = await this.getAllUrl(url, this.page);
    for (const href of hrefs) {
      await this.visitAll(href, step - 1, ans);
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
  getSiteInfo = async (url) => {
    const newMaker = {};

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
      if (avatarUrl) newMaker.avatarUrl = avatarUrl;
      if (description) newMaker.description = description;
      if (socialUrl) newMaker.socials = socialUrl;
      if (rssFeed) newMaker.feed_url = rssFeed;
      return newMaker;
    } catch (e) {
      console.log("Cannot fetch information from the site", e);
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

  getText = async (url) => {
    await this.visitPage(this.page, url);
    return this.page.$eval("*", (el) => {
      return el.innerText;
    });
  };

  getHTML = async (url) => {
    await this.visitPage(this.page, url);
    return this.page.$eval("*", (el) => {
      if (el.innerText.length && el.innerText.length > 0) return el.outerHTML;
    });
  };
}

module.exports = CrawlerService;
