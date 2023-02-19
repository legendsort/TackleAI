const CrawlerService = require("./scrape/service");
const fs = require("fs");
const axios = require("axios");
const {Configuration, OpenAIApi} = require("openai");

const content = "Some content!";

const testGetContent = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  const data = await Crawler.getContent(url);
  console.log(data);
  await fs.writeFileSync("test.txt", data);
  console.log("FINISH");
  await Crawler.initBrowser();
};

// testGetContent("https://www.hillcountryswimbaits.com/");

const testScrapeAllURL = async (url) => {
  const Crawler = new CrawlerService();
  await Crawler.init();
  let a = [];
  await Crawler.visitAll(url, 1, a);
  console.log(a);

  await fs.writeFileSync("test.txt", a.join("\n"));
  console.log("FINISH");
  await Crawler.initBrowser();
};

// testScrapeAllURL("https://rafascustombaits.com/");

const apiKey = "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";

const checkOneProductPage = async (url) => {
  // const Crawler = new CrawlerService();
  // await Crawler.init();
  // let text = await Crawler.getText(url);
  // if (text.length > 500) {
  //   text = text.substr(0, 500);
  // }
  const configuration = new Configuration({
    // organization: "org-z4iHBt1aOjmEeIJmx1XXMcJb",
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);
  // const prompt =
  //   "Question 1: What is the meaning of life?\n\nQuestion 2: How do airplanes fly?\n\nQuestion 3: What are the symptoms of COVID-19?";
  // const completion = await openai.createCompletion({
  //   prompt: prompt,
  //   model: "text-davinci-003",
  //   max_tokens: 100,
  //   n: 1,
  //   stop: "\n\n",
  // });
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    max_tokens: 500,
    n: 2,
    prompt:
      url +
      "\nQ: Above page is about bait or lure product? And the page has only one product title and price and description for bait/lure product? If my questions are all right, respond 'yes' otherwise 'no'\nA:",
  });
  const answer = completion.data.choices[0].text.trim();
  // await Crawler.initBrowser();

  console.log(url, answer);
  // const check = answer === "Yes";
  // console.assert(answer === "Yes" || answer === "No");
  // console.log(answer);
  // return check;
};

const filterProductURL = async () => {
  const urllist = await fs.readFileSync("./test.txt", "utf-8").toString().split("\n");
  // console.log(urllist);
  let ans = [];
  for (let i = 0; i < urllist.length; i++) {
    const check = await checkOneProductPage(urllist[i]);
    console.log(check);
    if (check) ans.push(urllist[i]);
  }
  // const ans = urllist.filter(async (url) => {
  //   return
  // });
  console.log("=====>");
  console.log(ans);
  return ans;
};

const urls = ["https://trueswimbaits.com/collections/all"];
for (const url of urls) {
  checkOneProductPage(url);
}
// checkOneProductPage("https://trueswimbaits.com/products/ba-spinner-pre-order");
// filterProductURL();
