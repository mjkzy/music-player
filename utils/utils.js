import jwt from "./jwt.js"

import { sql } from "../app.js"

export default {
    redirect_to_error_page(response, errorMessage, code) {
        response.status(code);
        response.redirect(`/error?message=${encodeURIComponent(errorMessage)}`);
    },

    async is_authed_and_registered(data) {
        const { token, state } = data;
        if (!token || !state || token === undefined || state === undefined)
            return false;

        const userInfo = jwt.decodeJwt(token);
        if (!userInfo)
            return false;

        if (userInfo.state !== state)
            return false;

        // if we made it this far, we know the user is valid session & token wise, so just double check they're
        // actually registered
        const registered_user_exists = await sql.prepare(`SELECT * FROM users WHERE uploader_id = ?`).get(userInfo.id);
        return registered_user_exists;
    }
}
