const CrawlerService = require("./scrape/service");

const fs = require("fs");

const content = "Some content!";

const test = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  const data = await Crawler.getContent(url);
  console.log(data);
  await fs.writeFileSync("test.txt", data);
  console.log("FINISH");
  //   await Crawler.initBrowser();
};

// test("https://www.hillcountryswimbaits.com/");

const test1 = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  let a = [];
  await Crawler.visitAll(url, 1, a);
  console.log(a);

  await fs.writeFileSync("test.txt", a.join("\n"));
  console.log("FINISH");
  //   await Crawler.initBrowser();
};

test1("https://www.hillcountryswimbaits.com/");
