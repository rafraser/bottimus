# Bottimus

Bottimus is a fun Discord bot with a wide variety of entertaining & helpful commands.

To add Bottimus to a server, click [here](https://discordapp.com/oauth2/authorize?client_id=309977253222023169&scope=bot&permissions=388160). This will require server management permissions.

Originally, Bottimus was created to help with event planning and other management tasks for a gaming community. Since that community closed, Bottimus' development has focused on creating new games and utility commands.

## Features

### Economy & Games

- !dailyspin to earn free coins every day!
- Earn currency by playing games such as !trivia, !typeracer, and !hangman
- Gamble your coins away with !scratchcard and !roulette
- Save up 1000 coins to redeem a !prize
  - ~~30~~ 49 unique prizes, designed by the fantastic [Dan Oak](https://danoakart.com/)
    ![Inventory](https://raw.githubusercontent.com/rafraser/bottimus/master/img/example/inventory.png)

### Miscellaneous

- !catfact
- !numberfact
- !8ball
- !dice

### VTexture

Generate colourful source engine texture packs! This functionality is currently in beta testing, and is only available in selected servers.

## Development

Bottimus is powered by [discord.js](https://discord.js.org/#/) - you will [NodeJS](https://nodejs.org/en/) 12.x or higher to run this project.

Install dependencies with npm:

```bash
npm install
```

You also need to provide a Discord API key in `development.env`:

```bash
DISCORD=<api_key_here>
```

Build the Typescript project & then boot Bottimus:

```bash
npm run build
npm run serve
```
