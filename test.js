const CrawlerService = require("./scrape/service");
const fs = require("fs");
const axios = require("axios");
const {Configuration, OpenAIApi} = require("openai");
require("dotenv").config();

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

const apiKey = process.env.OPENAI_API_KEY;
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

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    max_tokens: 500,
    n: 2,
    prompt:
      url +
      "\nI gave you the list of urls\n" +
      // "This web page is one page of shop web site for bait/lure.\n" +
      "Question: Please find bait product pages for sale from these urls" +
      // "Question: This product is cup?" +
      // "Question: Image is smilar to fish?" +
      "\n\nA: ",
  });
  const answer = completion.data.choices[0].text.trim();
  // await Crawler.initBrowser();

  console.log(url, answer);

  // const prompt =
  //   "Question 1: What is the meaning of life?\n\nQuestion 2: How do airplanes fly?\n\nQuestion 3: What are the symptoms of COVID-19?";
  // const completion = await openai.createCompletion({
  //   prompt: prompt,
  //   model: "text-davinci-003",
  //   max_tokens: 100,
  //   n: 1,
  //   stop: "\n\n",
  // });
  // const completion = await openai.createCompletion({
  //   model: "text-davinci-003",
  //   max_tokens: 500,
  //   n: 2,
  //   prompt:
  //     url +
  //     "\nI gave you the url of web page I am considering.\n" +
  //     // "This web page is one page of shop web site for bait/lure.\n" +
  //     "You can classify this webpage with 4 types\n" +
  //     "1. Pages like homepage or introudction or contact or news or blog or account or about or cart page\n" +
  //     "2. Product list page which list multiple products with short info.\n" +
  //     "3. Product page for sale which has only one main product with detailed info for only one product includes price, description and several images. \n" +
  //     "4. The other\n" +
  //     "Question: Please respond only 'yes' if you think this page is 90% likely type 3 and the product is fish bait, otherwise 'no'" +
  //     // "Question: This product is cup?" +
  //     // "Question: Image is smilar to fish?" +
  //     "\n\nA: ",
  // });
  // const answer = completion.data.choices[0].text.trim();
  // // await Crawler.initBrowser();

  // console.log(url, answer);
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

const urls = [
  "https://sdgcustomlurecraft.com/shop/p/flicker-minnow",
  "https://sdgcustomlurecraft.com/shop/p/sdg-logo-hat",
  "https://sdgcustomlurecraft.com/shop/p/sdg-logo-t-shirt",
  "https://sdgcustomlurecraft.com/shop/p/100-reidball-t-shirt-free-shipping",
  "https://sdgcustomlurecraft.com/shop/p/sdg-mug",
  "https://sdgcustomlurecraft.com/",
  "https://sdgcustomlurecraft.com/shop",
  "https://sdgcustomlurecraft.com/shop/p/finesse-bladed-jigs",
];

// checkOneProductPage(urls);
// for (const url of urls) {
//   checkOneProductPage(url);
// }
// checkOneProductPage("https://trueswimbaits.com/products/ba-spinner-pre-order");
// filterProductURL();
