// Imports the `sendResponse` function from a helper module.
// The `sendResponse` function will be used to send HTTP responses in the endpoint methods.
const {sendResponse} = require("../helper");

// Imports a `CrawlerService` object from a scrape service module.
const CrawlerService = require("../scrape/service");

// Imports the `Configuration` and `OpenAIApi` classes from the `openai` module.
const {Configuration, OpenAIApi} = require("openai");

// Assigns the value of the `OPENAI_API_KEY` environment variable to a variable named `apiKey`.
const apiKey = process.env.OPENAI_API_KEY;

// Defines the `scrapeSeller` function that gets site information from a given URL.
const scrapeSeller = async (url) => {
  // Creates a new `CrawlerService` object.
  const Crawler = new CrawlerService();

  try {
    // Initializes the `Crawler` object and runs the `init()` function.
    await Crawler.init();

    // Gets site information by calling the `getSiteInfo` method of the `Crawler` object and passing in the URL.
    const response = await Crawler.getSiteInfo(url);

    // Initializes the `Crawler` object within a browser context and returns data and error information.
    await Crawler.initBrowser();
    return {
      data: response,
      error: null,
    };
  } catch (e) {
    // Logs errors encountered within the `try` block.
    console.log(e);

    // Initializes the `Crawler` object within a browser context and returns null data and the caught exception for error.
    await Crawler.initBrowser();
    return {
      data: null,
      error: e,
    };
  }
};

// Defines the `checkOneProductPage` function that utilizes a pre-configured OpenAI API to filter bait products from a given seller link.
const checkOneProductPage = async (url) => {
  // Creates a configuration object using the `apiKey` obtained from process.env.
  const configuration = new Configuration({
    apiKey: apiKey,
  });

  // Defines an OpenAIApi object
  const openai = new OpenAIApi(configuration);

  try {
    // Makes an asynchronous call to the `createChatCompletion()` method and passes in a model and an array of messages.
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        // A system message containing the url of webpage
        {role: "system", content: `This is the JSON data of list of urls of webpage: ${JSON.stringify(url)}`},
        // A user message requesting information about bait product pages
        {
          role: "user",
          content:
            "Please find bait product pages for sale from these urls. Please respond simply JSON data of list of urls  without any description or header. If you can't respond only [].",
        },
      ],
    });
    // Extracts the content of the message as a JSON array of bait products URLs and returns it.
    const content = completion.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (e) {
    // Logs errors encountered by the OpenAIApi or the `JSON.parse` method.
    console.log(e);
    // Returns null to be used in error handling.
    return [];
  }
};

// Defines the `filterProductURL` function that handles the filtering of bait product pages from a given list of URLs.
const filterProductURL = async (urlList) => {
  // Calls the `checkOneProductPage()` function and returns the results.
  const ans = await checkOneProductPage(urlList);
  return ans;
};

// Defines the `getProductList` function, which loads all the URLs of seller pages and filters bait product URLs.
const getProductList = async (url, step) => {
  // Creates a new `CrawlerService` object.
  const Crawler = new CrawlerService();

  try {
    // Initializes the `Crawler` object and runs the `init()` function.
    await Crawler.init();

    // Creates an empty array named `urlList`.
    let urlList = [];

    // Checks is to check url is valid url or not.
    const checkUrl = await Crawler.visitPage(Crawler.page, url);
    if (checkUrl === false) throw "Url is not valid";

    // find all sub urls from website and saves it in urlList
    await Crawler.visitAll(url, step, urlList);
    console.log({urlList})
    // Calls the `filterProductURL()` method of the `Crawler` object and passes in the `Crawler` object and `urlList`.
    const productUrlList = await filterProductURL(urlList);

    // Initializes `Crawler` within a browser context and returns data and error information.
    await Crawler.initBrowser();
    return {
      data: productUrlList,
      error: null,
    };
  } catch (e) {
    // Logs any exception that may occur within the `try` block.
    console.log(e);

    // Initializes `Crawler` within a browser context and returns null data and the caught exception for error.
    await Crawler.initBrowser();
    return {
      data: null,
      error: e,
    };
  }
};

// Exports an object containing the `fetch` and `productList` functions.
module.exports = {
  // for fetching seller details
  fetch: async (req, res) => {
    // Extracts the `url` value from the query parameters passed in the GET request.
    const {url} = req.query;

    // Calls the `scrapeSeller()` function and passes in the `url` value.
    const {data, error} = await scrapeSeller(url);

    // Sends an error response if the fetch function encountered an error.
    if (error) return sendResponse(res, 500, error, data);

    // Sends a successful response if the fetch function did not encounter any errors.
    return sendResponse(res, 200, "Successfully scrape data of seller", data);
  },
  // for fetching all product details
  productList: async (req, res) => {
    // Extracts the `url` value from the query parameters passed in the GET request.
    const {url} = req.query;

    // Calls the `getProductList()` method and passing the `url` value and maximum number of steps.
    const {data, error} = await getProductList(url, 10);

    // Sends an error response if the productList function encountered an error.
    if (error) return sendResponse(res, 500, error, data);

    // Sends a successful response with the filtered bait products URLs count and the URLs information.
    return sendResponse(
      res,
      200,
      `Successfully scrape ${data.length} bait products from the website`,
      data
    );
  },
};
