const fs = require("fs");
require("dotenv").config();
const CronJob = require("cron").CronJob;
const CrawlerService = require("./service");
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

const ScrapeMakers = async () => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  const makerList = await fetch(supabase, "makers");
  const newMakerList = [];
  for (const maker of makerList) {
    const {url, name, slug} = maker;
    const newMaker = await Crawler.getSiteInfo(maker);
    newMakerList.push(newMaker);
    console.log(newMaker);
    await upsert(supabase, "makers", newMaker);
  }
  console.log(newMakerList);
  process.exit(0);
};

// ScrapeItem();
ScrapeMakers();
