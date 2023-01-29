require("dotenv").config();
const fs = require("fs");
const cors = require("cors");
const logger = require("morgan");
const jwt = require("express-jwt");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const CronJob = require("cron").CronJob;

const supabase = require("./supabase/anon");
const CrawlerService = require("./scrape/service");
const {fetch, upsert} = require("./supabase/supbase");
const itemRouter = require("./routes/itemRouter");
const makerRouter = require("./routes/makerRouter");
const scrapeRouter = require("./routes/scrapeRouter");

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

// scrape(3).then((res) => {
//   console.log(res);
// });

// express settings
const app = express();
app.use(logger("dev"));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(bodyParser.json({limit: "50mb"}));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 5000,
  })
);

// register route
const baseUrl = process.env.BASE_URL;
app.use(baseUrl + "/maker", makerRouter);
app.use(baseUrl + "/item", itemRouter);
app.use(baseUrl + "/scrape", scrapeRouter);

module.exports = app;
