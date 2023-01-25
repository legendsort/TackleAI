const puppeteer = require("puppeteer-extra");
const makerList = require("./maker.json");

const config = {
  width: 1800,
  height: 800,
  headless: false,
  timeout: 120000,
  ignoreHTTPSErrors: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--disable-breakpad",
    "--disable-notifications",
    "--disable-desktop-notifications",
    "--disable-component-update",
    "--disable-background-downloads",
    "--disable-add-to-shelf",
    "--disable-datasaver-prompt",
    "--ignore-urlfetcher-cert-requests",
    "--ignore-certificate-errors",
    "--disable-client-side-phishing-detection",
    "--autoplay-policy=no-user-gesture-required",
    "--disable-web-security",
    "--allow-running-insecure-content",
    "--use-system-clipboard",
  ],
};

/**
 * Class to crawl baits from the sites
 */
class CrawlerService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

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
      let response = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === "media") {
          response[key] = await page.$$eval(value, (data) =>
            data.map((x) => {
              return {
                type: 1,
                url: x.src,
                alt: x.alt,
              };
            })
          );
          continue;
        }
        response[key] = (await page.$$eval(value, (data) => data.map((x) => x.innerText)))[0];
      }
      console.log(response);
      return response;
    } catch (e) {
      console.log("Error when scrape detailed data: ", e);
    }
  };
  //execute the script
  execute = async () => {
    await this.initBrowser();
    await this.launchBrowser();
    this.page = await this.openNewPage();

    // iterate the maker list
    for (const {makerName, script} of makerList) {
      console.log("---> scrape ", makerName);
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
              response.maker = makerName;
              response.url = this.page.url();
              console.log(response);
            }
            console.log(baits);
        }
      }
    }
  };
}

module.exports = CrawlerService;
