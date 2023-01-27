const fs = require("fs");
require("dotenv").config();
const CronJob = require("cron").CronJob;
const CrawlerService = require("./service");
const supabase = require("./supabase/anon");

const ScrapeData = async () => {
  const {data, error} = await supabase.from("makers").select();
  console.log(error);
  console.log(data);
  return;
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
