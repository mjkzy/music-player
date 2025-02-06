# music-player

A self-hosted, standalone application that plays music. Uses Discord OAuth for authentication.

- Basic player controls (previous, last 10s, play, next 10s, next)
- Song queue
- Upload & delete tracks
- See who uploaded the song via Discord avatar & name
- Make instance private to a specific Discord Guild

<details>
  <summary>Screenshots</summary>

### Home:
![index](./.github/index.png)

### Player (PC):
![error](./.github/player.png)

### Player (Mobile):
![error](./.github/playermobile.png)

### Error:
![error](./.github/error.png)
</details>

## Installation

### Setup
1. Create a new [Discord Application](https://discord.com/developers/applications).
2. Under the OAuth2 tab, add a new redirect of `https://your-domain.here/validate`.
3. Proceed with the [install](#install).
4. Reverse proxy `http://localhost:port` to your (sub)domain with HTTPS.
5. Edit the `config.json.example` to be a valid `config.json`, and then setup your config like so

### Requirements
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) >= v16.14.0

### Install dependencies

```bash
git clone https://github.com/mjkzy/music-player.git
cd music-player
npm i
```

## Configuration

| Key             | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| clientId        | Your Discord Bot's Client ID.                                                        |
| clientSecret    | Your Discord Bot's Client Secret.                                                    |
| port            | The port to run this application on.                                                 |
| websiteUrl      | The URL of this site (if running IP:PORT, put in url).                               |
| jwtSecret       | Random characters, should never be modified.                                         |
| guildId         | The ID of the server to check if users are in.                                       |
| dev             | Enable development options                                                           |
