const fs = require("fs");
require("dotenv").config();
const CronJob = require("cron").CronJob;
const CrawlerService = require("./scrape/service");
const supabase = require("./supabase/anon");
const {fetch, upsert} = require("./supabase/supbase");

const ScrapeItem = async () => {
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

// ScrapeItem();
// ScrapeMakers();

//
const scrape = async (id = null) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  const makerList = await fetch(supabase, "makers", id);

  const response = [];

  for (const maker of makerList) {
    const newMaker = await Crawler.getSiteInfo(maker);
    response.push({
      maker: newMaker,
    });
  }
  if (id == null) return response;
  if (response.length == 0) return null;
  return response[0];
};

scrape(3).then((res) => {
  console.log(res);
  process.exit(0);
});
