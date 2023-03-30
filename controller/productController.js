const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
const chunkSize = 5000;

const configuration = new Configuration({apiKey: apiKey});
const openai = new OpenAIApi(configuration);

const prompts = {
  price:
    "What is the price of the product according to content? (In case sold out, respond only previous pirce number.) Please responsd only number",
  title: "What is the title of the product according to content? Please respond only title",
  description:
    "What is the description of the product  according to content? Please respond only description",
  sku: "What is the sku of the product according to content? Please respond only with sku.  If not defined, respond only None",
  media: "Please answer current bait product image information(Image should be exist and image should be only current product's image and pixel size should be bigger than 240px).Answer simply must be only JSON string of array of {type:1, url: url, alt: string}. Please respond simply JSON without any description or header"
};

const extractNumber = (str) => {
  const match = str.match(/\d+/);
  if (match) {
    return parseInt(match[0]);
  }
  return null;
};

const getAnswer = async (text, url, prompt) => {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: `This is the current webpage url: ${url}`},
        {role: "system", content: `This is the content of this page: ${text}`},
        {role: "user", content: prompt},
      ],
    });
    const content = completion.data.choices[0].message.content;
    return content;
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getMedia = async (media, url, prompt) => {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: `This is the current webpage url: ${url}`},
        {role: "system", content: `This page is one bait product page`},
        {role: "system", content: `This is the JSON data of all image urls and alt data in this page: ${JSON.stringify(media)}`},
        {role: "user", content: prompt},
      ],
    });
    const content = completion.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (e) {
    console.log(e);
    return null;
  }
}

const scrapeDetail = async (url) => {
  const Crawler = new CrawlerService();

  try {
    await Crawler.init();

    let text = await Crawler.getText(url);
    if (text === false) throw "Url is not valid";
    let image = await Crawler.getImages(url);

    if (text.length > chunkSize) text = text.substr(0, chunkSize);
    const allMedia = image.map((img) => {
      return {
        type: 1,
        url: img.src,
        alt: img.alt,
      };
    });
    const price = extractNumber(await getAnswer(text, url, prompts.price));
    const title = await getAnswer(text, url, prompts.title);
    const description = await getAnswer(text, url, prompts.description);
    const sku = await getAnswer(text, url, prompts.sku);
    const media = await getMedia(allMedia, url, prompts.media);

    let response = {
      price,
      title,
      description,
      media
    }
    if(sku !== 'None') response.sku = sku;
    await Crawler.initBrowser();

    return {
      data: response,
      error: null,
    };
  } catch (e) {
    await Crawler.initBrowser();
    console.log(e);
    return {
      data: null,
      error: e,
    };
  }
};

module.exports = {
  fetch: async (req, res) => {
    const {url} = req.query;
    const {data, error} = await scrapeDetail(url);

    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully scraped detail of product", data);
  },
};
