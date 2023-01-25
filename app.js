const fs = require("fs");
const CrawlerService = require("./service");

const Crawler = new CrawlerService();

Crawler.execute().then((data) => {
  fs.writeFileSync("./scrapeData.json", JSON.stringify(data, null, 2), "utf-8");
});
