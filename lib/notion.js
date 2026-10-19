async function queryAll(notion, databaseId) {
  let results = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    results = [...results, ...response.results];
    cursor = response.next_cursor || undefined;
  } while (cursor);
  return results;
}

module.exports = { queryAll };
