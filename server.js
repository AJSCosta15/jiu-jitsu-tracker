const express = require('express');
const { Client } = require('@notionhq/client');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

app.get('/api/treinos', async (req, res) => {
    try {
        if (!databaseId || !process.env.NOTION_API_KEY || databaseId === 'seu_database_id_aqui') {
            return res.json({ fallback: true, message: "Configure as chaves do Notion no .env", results: [] });
        }
        
        let results = [];
        let cursor = undefined;
        // Paginate through Notion results
        do {
            const response = await notion.databases.query({
                database_id: databaseId,
                start_cursor: cursor,
                // Uncomment to add default sorting if necessary
                // sorts: [{ timestamp: 'created_time', direction: 'descending' }]
            });
            results = [...results, ...response.results];
            cursor = response.next_cursor;
        } while (cursor);
        
        res.json({ results, fallback: false });
    } catch (error) {
        console.error("Notion API Error:", error.body ? error.body : error);
        res.status(500).json({ error: 'Erro ao buscar dados do Notion', details: error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
