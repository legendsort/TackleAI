const {fetch} = require("../supabase/supbase");
const supabase = require("../supabase/anon");
module.exports = {
  fetch: async (req, res) => {
    console.log("ASDASD");
    const {data, error} = await fetch(fetch, "makers", id);
    if (error == null) {
      return res.status(400).json({
        message: error,
        data: data,
      });
    }
    return res.status(200).json({
      message: "Successfully fetched",
      data: data,
    });
  },
};
