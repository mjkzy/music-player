import SQLite from "better-sqlite3";
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'path';

import router from "./router.js";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const {
    clientId, clientSecret, websiteUrl, port, guildId, dev
} = require(`./config.json`);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join("./", 'views'));

app.use(express.static(path.join("./", 'public')));
app.use(cookieParser());
app.use(router);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

    if (dev)
    {
        console.warn("WARNING: dev is enabled, cookies ARE UNSECURE");
    }
});

// create music database
export const sql = new SQLite(`./db.sqlite`);
sql.prepare(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY UNIQUE, uploader_id TEXT)`).run();
sql.prepare(`
    CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY UNIQUE,
        avatar TEXT,
        file_path TEXT,
        file_name TEXT,
        uploader_id TEXT,
        uploader_name TEXT,
        upload_time TEXT,
        title TEXT,
        duration TEXT
    )
`).run();
sql.pragma(`synchronous = 1`);
sql.pragma(`journal_mode = wal`);
process.on(`exit`, () => sql.close());
process.on(`SIGHUP`, () => process.exit(128 + 1));
process.on(`SIGINT`, () => process.exit(128 + 2));
process.on(`SIGTERM`, () => process.exit(128 + 15));
