const {sendResponse} = require("../helper");
const CrawlerService = require("../scrape/service");
const {Configuration, OpenAIApi} = require("openai");

const apiKey = process.env.OPENAI_API_KEY;

const scrapeDetail = async (url) => {
  const Crawler = new CrawlerService();
  try {
    await Crawler.init();
    let text = await Crawler.getText(url);
    let images = await Crawler.getImages(url);

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
      description: text + "\nQ: What is description of the product?\nA:",
      sku: text + "\nQ: What is the sku of the product? Please answer only sku\nA:",
    };

    const openai = new OpenAIApi(configuration);

    let response = {
      url: url,
      live: false,
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
    console.log(images);
    const getImageLinkPrompt =
      text +
      "\n" +
      images +
      "\n" +
      `Q: please provide the object array contains link and alt of current product's images. Format like this: [{"type": 1, "url": "https://lin.com/test1", "alt": "Swim Bait"}, {"type": 1, "url": "https://lin.com/test2", "alt": "Wood Bait"}] /nA: `;

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
