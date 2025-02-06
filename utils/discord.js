import fetch from "node-fetch";

export default {
    API: `https://discord.com/api/v10`,

    async call_discord_api(token, url) {
        const result = await fetch(`${this.API}/${url}`, {
            method: `GET`,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await result.json();
        return (!result.ok ? undefined : data);
    },

    async getUserInfo(token) {
        let user_data = await this.call_discord_api(token, "users/@me");
        if (user_data === undefined)
        {
            return undefined;
        }

        user_data.guilds = await this.call_discord_api(token, "users/@me/guilds"); // can be undefined

        return user_data;
    },
};
