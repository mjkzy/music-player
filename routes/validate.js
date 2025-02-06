import express from "express";
const router = new express.Router();

import fetch from "node-fetch";
import jwt from "../utils/jwt.js";
import discord from "../utils/discord.js";
import {
    clientId,
    clientSecret,
    websiteUrl,
    guildId,
    sql,
    dev
} from "../app.js";
import utils from "../utils.js";

router.get(`/`, async (request, response) => {
    if (request.method !== `GET`)
        return utils.redirect_to_error_page(response, `Cannot GET validate`, 405);

    const { code, state } = request.query;
    if (!code)
        return utils.redirect_to_error_page(response, `No code provided`, 401);

    // handle discord oauth
    try {
        const oauthResult = await fetch(`https://discord.com/api/oauth2/token`, {
            method: `POST`,
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: `authorization_code`,
                redirect_uri: `${websiteUrl}/validate`,
                scope: `identify guilds`,
            }),
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`,
            },
        });
        if (!oauthResult.ok) throw `Failed to get oauth result`;

        const oauthData = await oauthResult.json();

        // get user info (with guilds too)
        const User = await discord.getUserInfo(oauthData.access_token, true);
        const oauthUser = {
            id: User.id,
            avatar: User.avatar,
            username: User.username,
            discriminator: User.discriminator,
            state: state
        };

        if (User.guilds === undefined) {
            throw `Failed to get user guilds`;
        }
        else {
            const allowed = User.guilds.some(guild => guild.id === guildId);
            if (!allowed) throw `You are not allowed to use this player.`;
        }

        const add_user_to_db = async function (id) {
            const added_to_db = await sql.prepare(`INSERT INTO users (uploader_id) VALUES (?)`).run(id);
            return added_to_db;
        }
        const result = await add_user_to_db(oauthUser.id)
        if (!result) throw `Failed to add song to database`;

        const token = jwt.createJwt(oauthUser, oauthData.expires_in);
        response.cookie('token', token, {
            httpOnly: true, // let js use
            secure: (dev ? false : true),
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
        });

        response.cookie('state', state, {
            httpOnly: true,
            secure: (dev ? false : true),
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        response.status(200);
        response.redirect(`player`);
    }
    catch (error) {
        // NOTE: An unauthorized token will not throw an error;
        // it will return a 401 Unauthorized response in the try block above
        utils.redirect_to_error_page(response, error.message, 401);
    }
});

export default router;
