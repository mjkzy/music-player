import jwt from "jsonwebtoken";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default {
    /**
     * @name createJwt
     * @description Creates a JWT token
     * @param  {string} data The data to encode in the token
     * @param  {*} duration The duration of the token
     * @returns {string} The signed JWT token
     */
    createJwt(data, duration) {
        const { jwtSecret } = require(`../config.json`);
        const options = {
            issuer: `music-player-backend`
        };

        if (duration)
            options.expiresIn = duration;

        return jwt.sign(data, jwtSecret, options);
    },

    /**
     * @name decodeJwt
     * @description Decodes a JWT token
     * @param  {string} token The token to decode
     * @returns {object} The decoded JWT token
     */
    decodeJwt(token) {
        const { jwtSecret } = require(`../config.json`);
        try {
            return jwt.verify(token, jwtSecret);
        }
        catch (error) {
            console.error(error);
            return false; // most likely a invalid token error, let's just return false nevertheless.
        }
    }
};
