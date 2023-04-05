const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

// get the API key from an environment variable
const apiKey = process.env.OPENAI_API_KEY;

// set the chunk size for text processing
const chunkSize = 5000;

// configure the OpenAI API
const configuration = new Configuration({apiKey: apiKey});
const openai = new OpenAIApi(configuration);

// define prompts for text processing
const prompts = {
  price:
    "What is the price of the product according to content? (In case sold out, respond only previous pirce number.) Please respond only number without any additional context or header.",
  title: "What is the title of the product according to content? Please respond only title  without any additional context or header.",
  description:
    "What is the description of the product according to content? Please respond only description without any additional context or header.",
  sku: "What is the sku of the product according to content? Please respond only with sku.  If not defined, respond only `None` without any additional context or header.",
  media:
    "Please answer current bait product image information(Image should be exist and image should be only current product's image and pixel size should be bigger than 240px).Answer simply must be only JSON string of array of {type:1, url: url, alt: string}. Please respond simply JSON without any description or header",
};

// helper function to extract a number from a string
const extractNumber = (str) => {
  const match = str.match(/\d+/);
  if (match) {
    return parseInt(match[0]);
  }
  return null;
};

// function to retrieve an answer to a prompt using the OpenAI API
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

// get all media link for current product
const getMedia = async (media, url, prompt) => {
  try {
    // Use OpenAI's API to create a chat completion object for the specified GPT-3 model
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // The GPT-3 model version to use
      messages: [
        {role: "system", content: `This is the current webpage url: ${url}`}, // A system message containing the URL of the current web page
        {role: "system", content: `This page is one bait product page`}, // A system message indicating that the page is a bait product page
        {
          role: "system",
          content: `This is the JSON data of all image urls and alt data in this page: ${JSON.stringify(
            media
          )}`,
        },
        {role: "user", content: prompt}, // A user message containing a prompt
      ],
    });
    // Get the content of the completed chat as a string, parse it as JSON, and return it
    const content = completion.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (e) {
    console.log(e); // Log any errors and return null
    return null;
  }
};

// scrape detailed information about the website
const scrapeDetail = async (url) => {
  const Crawler = new CrawlerService(); // Create a new instance of the CrawlerService class

  try {
    await Crawler.init(); // Initialize the crawler

    let text = await Crawler.getText(url); // Get the text content of the web page
    if (text === false) throw "Url is not valid"; // If the text content is not found, throw an error
    let image = await Crawler.getImages(url); // Get all images on the web page

    if (text.length > chunkSize) text = text.substr(0, chunkSize); // If the text content is longer than a specified chunk size, truncate it
    const allMedia = image.map((img) => {
      // Create an array of objects containing image type, URL, and alt data
      return {
        type: 1,
        url: img.src,
        alt: img.alt,
      };
    });
    const price = extractNumber(await getAnswer(text, url, prompts.price)); // Use AI to extract a product price from the text content
    const title = await getAnswer(text, url, prompts.title); // Use AI to extract a product title from the text content
    const description = await getAnswer(text, url, prompts.description); // Use AI to extract a product description from the text content
    const sku = await getAnswer(text, url, prompts.sku); // Use AI to extract a product SKU from the text content
    const media = await getMedia(allMedia, url, prompts.media); // Use OpenAI's API to get JSON data for all images on the page

    let response = {
      price,
      title,
      description,
      media,
    };
    if (sku !== "None") response.sku = sku; // If a SKU is found, add it to the response object
    await Crawler.initBrowser(); // Initialize the crawler's browser instance

    return {
      data: response,
      error: null,
    };
  } catch (e) {
    await Crawler.initBrowser(); // Re-initialize the crawler's browser instance
    console.log(e); // Log any errors and return null data and the error message
    return {
      data: null,
      error: e,
    };
  }
};

module.exports = {
  fetch: async (req, res) => {
    // Export an asynchronous function called "fetch" that takes request and response objects as parameters
    const {url} = req.query; // Get the URL from the request query parameters
    const {data, error} = await scrapeDetail(url); // Call the "scrapeDetail" function with the URL and await its response

    if (error) return sendResponse(res, 500, error, data); // If there is an error, return a 500 status code with the error message
    return sendResponse(res, 200, "Successfully scraped detail of product", data); // Otherwise, return a 200 status code with the scraped product detail data
  },
};
