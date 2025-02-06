import express from "express";
import fs from "fs";
import multer from 'multer';
import path from "path";
import { randomUUID } from "crypto";

import { fileTypeFromBuffer } from 'file-type';

import jwt from "../utils/jwt.js"
import utils from "../utils/utils.js";

import { sql } from "../app.js";

//import { createRequire } from "node:module";
//const require = createRequire(import.meta.url);
//const NodeID3 = require("node-id3")

const router = new express.Router();

const AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/x-m4a', 'audio/x-ms-wma'];

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/songs');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        if (!AUDIO_MIMES.includes(file.mimetype)) {
            cb(new Error('Invalid audio file type'), false);
        }
        else {
            cb(null, true);
        }
    }
});

router.get('/', async (req, res) => {
    const is_cookies_valid = await utils.is_authed_and_registered(req.cookies);
    if (!is_cookies_valid) {
        utils.redirect_to_error_page(res, `Invalid session state`, 401);
        return;
    }

    let songs = {}
    try {
        // get all current songs from database and show to user
        songs = sql.prepare(`
            SELECT id, avatar, file_name AS name, file_path AS path, uploader_id, uploader_name, upload_time, title
            FROM songs ORDER BY upload_time DESC
        `).all();

        res.render('player', { songs });
    } catch (err) {
        utils.redirect_to_error_page(res, `Failed to get songs: ${err}`, 500);
    }
});

router.get('/logout', async (req, res) => {
    const is_cookies_valid = await utils.is_authed_and_registered(req.cookies);
    if (!is_cookies_valid) {
        res.redirect('/'); // silently go back to home page
        return;
    }

    // clear auth cookies
    res.clearCookie('token');
    res.clearCookie('session');
    res.clearCookie('upload_popup');
    res.clearCookie('volume');

    res.redirect('/');
})

router.post('/delete', async (req, res) => {
    try {
        const is_cookies_valid = await utils.is_authed_and_registered(req.cookies);
        if (!is_cookies_valid) throw `Invalid session state`;

        const userInfo = jwt.decodeJwt(req.cookies.token);
        if (!userInfo || !userInfo.id) throw `Invalid or expired authentication`;

        const trackId = req.query.id;
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trackId))
            throw `Invalid track ID`;

        const song = sql.prepare(`SELECT * FROM songs WHERE id = ?`).get(trackId);
        if (!song) throw `Song not found`;

        if (userInfo.id !== '259136594185814017' && song.uploader_id !== userInfo.id)
            throw `You are not allowed to delete this`;

        if (fs.existsSync(song.file_path)) {
            fs.unlink(song.file_path, (err) => {
                if (err)
                    console.error('Error deleting file:', err);
            });
        }

        sql.prepare(`DELETE FROM songs WHERE id = ?`).run(trackId);

        res.status(200); // OK
        res.redirect(`player`);
    } catch (err) {
        utils.redirect_to_error_page(res, err, 500);
    }
});

router.post('/upload', (req, res, next) => {
    // catch multer upload in callback for handling errors
    upload.single('song')(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            utils.redirect_to_error_page(res, `Upload failed: ${err.message}`, 401);
            return;
        }
        next();
    });
}, async (req, res) => {
    try {
        const is_cookies_valid = await utils.is_authed_and_registered(req.cookies);
        if (!is_cookies_valid) throw `Invalid session state`;

        const song = req.file;
        if (!song) throw `No audio file uploaded`;

        // verify MIME matches magic number from file
        const audio_file_type = await fileTypeFromBuffer(fs.readFileSync(song.path));
        if (!audio_file_type || !AUDIO_MIMES.includes(audio_file_type.mime))
            throw `File type is not allowed`;

        const uploadedFilePath = path.join("./", 'public', 'songs', song.filename);
        const originalName = song.originalname.replace(/\.[^/.]+$/, '').replace(/\(|\)/g, '');
        /*
        const tags = {
            title: originalName
        };

        // TODO: not sure if needed atm, but i think i did this for cleaner names or something
        const success = NodeID3.write(tags, uploadedFilePath);
        if (!success) throw `Failed to write metadata to MP3 file`;
        */

        let userInfo = jwt.decodeJwt(req.cookies.token);
        if (!userInfo) throw `Cannot parse user info`;

        const added_to_db = sql.prepare(`INSERT INTO songs (id, avatar, file_path, file_name, uploader_id, uploader_name, upload_time, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(randomUUID(), userInfo.avatar, uploadedFilePath, song.filename, userInfo.id, userInfo.username, new Date().toISOString(), originalName);
        if (!added_to_db) throw `Failed to add song to database`;

        res.status(200); // OK
        res.redirect(`player`);
    } catch (err) {
        utils.redirect_to_error_page(res, err, 401);
    }
});

/*
router.get('/metadata', async (req, res) => {
    const is_cookies_valid = await utils.is_authed_and_registered(req.cookies);
    if (!is_cookies_valid)
        return utils.redirect_to_error_page(res, `Invalid upload data`, 401);

    const songsDir = path.join("./", 'public', 'songs');

    let filePath = req.query.file;
    filePath = decodeURIComponent(filePath);

    NodeID3.read(path.join(songsDir, filePath), (err, tags) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read metadata' });
        }

        let cover = null;
        if (tags.image && tags.image.imageBuffer) {
            cover = `data:${tags.image.mime};base64,${tags.image.imageBuffer.toString('base64')}`;
        }

        res.json({
            title: tags.title || 'Unknown',
            artist: tags.artist || 'Unknown',
            album: tags.album || 'Unknown',
            cover,
        });
    });
});
*/

export default router;
