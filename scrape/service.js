// Importing required modules
const puppeteer = require("puppeteer-extra");
const {convertToSlug} = require("../helper");
const socialList = require("../config/social.json");
const rssList = require("../config/rss-feed.json");

// List of URLs to skip while crawling
const skipUrlList = ["about", "account", "blog", "blogs", "new", "news", "cart"];

// Path to Chromium executable
const chromiumPath = process.env.CHROMIUM;

// Configuration options for Puppeteer
const config = {
  width: 1800,
  height: 800,
  headless: true,
  timeout: 120000,
  ignoreHTTPSErrors: true,
  args: ["--disable-gpu", "--disable-dev-shm-usage", "--disable-setuid-sandbox", "--no-sandbox"],
  executablePath: chromiumPath,
};

/**
 * Class representing a crawler service to extract data from websites
 */
class CrawlerService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  // Method to initialize the crawler
  init = async () => {
    await this.initBrowser();
    await this.launchBrowser();
    this.page = await this.openNewPage();
  };

  // Method to close any existing browser instances
  initBrowser = async () => {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
        console.log("Error occurred when closing chromium: ", e);
        throw e;
      }
    }
  };

  // Method to launch a new instance of Chromium browser
  launchBrowser = async () => {
    try {
      this.browser = await puppeteer.launch(config);
    } catch (e) {
      console.log("Error occurred when launching chromium: ", e);
      throw e;
    }
  };

  // Method to check if two URLs belong to the same domain
  isSameDomain = async (url1, url2) => {
    try {
      const u1 = new URL(url1);
      const u2 = new URL(url2);
      return u1.hostname === u2.hostname;
    } catch (err) {
      return false;
    }
  };

  // Method to check if a given URL points to a product page
  isProductUrl = (url) => {
    const pathArray = url.split("/");
    const category = pathArray[3];
    for (const item of skipUrlList) {
      if (category.includes(item)) {
        return false;
      }
    }
    return true;
  };

  // Method to retrieve all valid URLs on a given page
  getAllUrl = async (url, page) => {
    const hrefs = await page.$$eval("a", (as) => as.map((a) => a.href.split("#")[0]));

    const realLink = [];
    for (const link of hrefs) {
      if ((await this.isSameDomain(url, link)) && this.isProductUrl(link)) realLink.push(link);
    }
    return realLink;
  };

  visitAll = async (url, step, ans) => {
    // Check if URL has already been visited
    if (ans.includes(url)) return;

    // Visit the page with given URL
    await this.visitPage(this.page, url);
    url = this.page.url();

    // Check if URL has already been visited after visiting the page
    if (ans.includes(url)) return;

    // Add the visited URL to the answer list
    ans.push(url);

    // Return if step is 0 (no more steps needed)
    if (step == 0) return;

    // Get all URLs on the visited page and visit them recursively
    const hrefs = await this.getAllUrl(url, this.page);
    for (const href of hrefs) {
      await this.visitAll(href, step - 1, ans);
    }
  };

  // Visit website with given URL
  visitPage = async (page, url) => {
    try {
      await page.goto(url, {waitUntil: "load", timeout: 1200000});
      return true;
    } catch (e) {
      console.log("Error when visiting new page: ", e.name, e.message);
      if (e.name === "TimeoutError") throw "Timeout Error";
      return false;
    }
  };

  // Open a new blank page
  openNewPage = async () => {
    try {
      return await this.browser.newPage();
    } catch (e) {
      console.log("Error when creating new page: ", e);
    }
  };

  // Get URLs of each bait from the shop page
  getUrlList = async (page, selector) => {
    try {
      const data = await page.$$eval(selector, (data) => data.map((x) => x.href));
      return data;
    } catch (e) {
      console.log("Error when getting URLs of baits from the page: ", e);
      return [];
    }
  };

  /**
   * Scrape data from a given URL and response schema
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
          // Get media URLs and alt text
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
        // Get inner text of elements
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
      console.log("Error when scraping detailed data: ", e);
    }
  };

  // Validate and format the response
  validResponse = (response) => {
    if (response.media)
      response.media.map((media) => {
        media.url = media.url.replace(" ", "");
      });
    return response;
  };

  // Execute the scraping script
  execute = async (makerList) => {
    // Iterate through the maker list
    for (const {makerName, script} of makerList) {
      for (const scriptItem of script) {
        const {type} = scriptItem;
        switch (type) {
          case "visit":
            // Visit a URL
            const {url} = scriptItem;
            await this.visitPage(this.page, url);
            break;
          case "getUrlList":
            // Get URLs of baits from the shop page and scrape their data
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

    try {
      const checkSite = await this.visitPage(this.page, url);
      if (checkSite === false) throw "Current web page is not valid";
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
        if (link === null) continue;
        socialUrl.push({
          url: link,
          type: site,
        });
      }
      if (avatarUrl) newMaker.avatar_url = avatarUrl;
      if (description) newMaker.description = description;
      if (socialUrl) newMaker.socials = socialUrl;
      if (rssFeed) newMaker.feed_url = rssFeed;
      return newMaker;
    } catch (e) {
      console.log("Cannot fetch information from the site", e);
      throw e;
    }
  };
  // get all text from the page
  getText = async (url) => {
    const checkUrl = await this.visitPage(this.page, url);
    if (checkUrl === false) return false;
    return this.page.$eval("*", (el) => {
      return el.innerText;
    });
  };
  // get html from the page
  getHTML = async (url) => {
    const checkUrl = await this.visitPage(this.page, url);
    if (checkUrl === false) return false;
    return this.page.$eval("*", (el) => {
      if (el.innerText.length && el.innerText.length > 0) return el.outerHTML;
    });
  };
  // get all images from the page
  getImages = async (url) => {
    await this.visitPage(this.page, url);
    const imageElementsHTML = await this.page.$$eval("img", (imgs) => {
      // return imgs.map((img) => img.src);
      let answer = [];
      for (const img of imgs) {
        answer.push({
          src: img.src,
          alt: img.alt,
        });
      }
      return answer;
    });
    return imageElementsHTML.filter(
      (data) =>
        data.src !== undefined &&
        data.src !== "" &&
        (data.src.includes("http") || data.src.includes("cdn.shopify.com"))
    );
  };
}

module.exports = CrawlerService;
