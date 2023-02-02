const {fetch} = require("../supabase/supbase");
const supabase = require("../supabase/anon");
const {sendResponse} = require("../helper");

module.exports = {
  fetch: async (req, res) => {
    const {id} = req.query;
    const {data, error} = await fetch(supabase, "makers", id);
    if (error) return sendResponse(res, 500, error, data);
    return sendResponse(res, 200, "Successfully fetched makers", data);
  },
};
