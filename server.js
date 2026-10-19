require('dotenv').config();
const { Client } = require('@notionhq/client');
const { createApp } = require('./lib/app');
const { queryAll } = require('./lib/notion');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const app = createApp({
  queryDatabase: (databaseId) => queryAll(notion, databaseId),
  treinosDbId: process.env.NOTION_API_KEY ? process.env.NOTION_DATABASE_ID : undefined,
  graduacoesDbId: process.env.NOTION_API_KEY ? process.env.NOTION_GRADUACOES_DB_ID : undefined,
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
