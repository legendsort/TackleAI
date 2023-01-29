// fetch all makers.
// if id is given, fetch one maker with id
const fetch = async (supabase, dbName, id = null) => {
  if (id == null) {
    const {data, error} = await supabase.from(dbName).select();
    return {data, error};
  }
  const {data, error} = await supabase.from(dbName).select().eq("id", id);
  return {data, error};
};

const upsert = async (supabase, dbName, input) => {
  const {data, error} = await supabase.from(dbName).upsert(input).select();
  return data;
};

module.exports = {
  fetch,
  upsert,
};
