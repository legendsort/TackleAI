const fs = require("fs");
const CronJob = require("cron").CronJob;
const CrawlerService = require("./service");

const ScrapeData = async () => {
  const Crawler = new CrawlerService();
  await Crawler.init();

  //scrape data periodically
  const job = new CronJob(
    "* * * * *",
    async () => {
      console.log("start job");
      const data = await Crawler.execute();
      await fs.writeFileSync("./scrapeData.json", JSON.stringify(data, null, 2), "utf-8");
    },
    null,
    false
  );
  job.start();
};

ScrapeData();
