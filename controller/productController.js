const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;

const scrapeDetail = async (url) => {
  const Crawler = new CrawlerService();
  try {
    await Crawler.init();
    const configuration = new Configuration({
      apiKey: apiKey,
    });

    const query = {
      price:
        url +
        "\nQ: How much does the product cost in web page with above url? I need only number(In case this is sold out, say 'Sold out')\nA:",
      title:
        url +
        "\nQ: What is title of the product in web page with above url? Please answer only title.\nA:",
      description:
        url +
        "\nQ: What is description of the product in web page with above url? Please answer only description,\nA:",
      sku:
        url +
        "\nQ: What is the sku of the product in web page with above url? Please answer  only sku.\nA:",
    };

    const openai = new OpenAIApi(configuration);

    let response = {
      url: url,
    };

    for (const [key, value] of Object.entries(query)) {
      try {
        const completion = await openai.createCompletion({
          model: "text-davinci-003",
          max_tokens: 2000,
          n: 1,
          prompt: value,
        });

        const answer = completion.data.choices[0].text.trim();
        console.log("===========>", key, answer);
        response[key] = answer;
      } catch (e) {}
    }
    const getImageLinkPrompt =
      url +
      `\nQ: please provide the object array contains link and alt of current product's images  in web page with above url. Format like this: [{"type": 1, "url": "https://lin.com/test1", "alt": "Swim Bait"}, {"type": 1, "url": "https://lin.com/test2", "alt": "Wood Bait"}] /nA: `;

    try {
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens: 2000,
        n: 1,
        prompt: getImageLinkPrompt,
      });
      const answer = completion.data.choices[0].text.trim();
      console.log(answer);
      const media = JSON.parse(answer);
      response.media = media;
    } catch (e) {
      console.log(e);
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
