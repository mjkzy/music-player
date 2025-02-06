import express from "express";
const router = new express.Router();

import utils from "../utils.js";

import {
clientId,
websiteUrl
} from "../app.js";

router.get('/', async (req, res) => {
    const is_cookies_valid = await utils.is_authed_and_registered(req.cookies);
    if (is_cookies_valid) {
        res.redirect(`player`);
        return;
    }

    const loginWithDiscordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${websiteUrl}/validate`)}&response_type=code&scope=identify+guilds`;

    res.render(`index.ejs`, {
        loginWithDiscordUrl
    });
});

export default router;
