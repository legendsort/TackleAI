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

test("https://gatordog-customs.myshopify.com/collections/all");
