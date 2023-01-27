const fetch = async (supabase, dbName) => {
  const {data, error} = await supabase.from(dbName).select();
  return data;
};

const upsert = async (supabase, dbName, input) => {
  const {data, error} = await supabase.from(dbName).upsert(input).select();
  return data;
};

module.exports = {
  fetch,
  upsert,
};
