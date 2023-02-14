const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;

const scrapeDetail = async (url) => {
  const Crawler = new CrawlerService();
  try {
    await Crawler.init();
    let text = await Crawler.getText(url);

    if (text.length > 500) {
      text = text.substr(0, 500);
    }

    const configuration = new Configuration({
      apiKey: apiKey,
    });

    const query = {
      price:
        text +
        "\nQ: How much does the product cost? If it was sold out, what is the previous cost? Please put only number first\nA:",
      title: text + "\nQ: What is title of the product? Please answer simply\nA:",
    };

    const openai = new OpenAIApi(configuration);

    let response = {};

    for (const [key, value] of Object.entries(query)) {
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 2000,
        n: 1,
        prompt: value,
      });

      const answer = completion.data.choices[0].text.trim();
      console.log("===========>", key, answer);
      response[key] = answer;
    }

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
