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
    let text = await Crawler.getText(url);
    if (text === false) throw "Url is not valid";
    let image = await Crawler.getImages(url);

    if (text.length > 4000) text = text.substr(0, 4000);
    const query = {
      price:
        text +
        "\n" +
        url +
        "\nQ: What is the price of the product according to text? (In case sold out, respond with only previous pirce number.)I need only number\nA:",
      title:
        text +
        "\n" +
        url +
        "\nQ: What is the title of the product according to text? Please answer only title.\nA:",
      description:
        text +
        "\n" +
        url +
        "\nQ: What is the description of the product according to text? Please answer only description,\nA:",
      sku:
        text +
        "\n" +
        url +
        "\nQ: What is the sku of the product according to text? Please answer only sku. If not defined, repond only None\nA:",
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
        if (key === "sku" && answer === "None") answer = null;
        response[key] = answer;
      } catch (e) {}
    }
    const media = image.map((img) => {
      return {
        type: 1,
        url: img.src,
        alt: img.alt,
      };
    });
    response.media = media;

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
