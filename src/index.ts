import { CommandoClient } from "discord.js-commando";
import {loadConfig} from "./config";

export let config = loadConfig();

const bot: CommandoClient = new CommandoClient({
    commandPrefix: config.prefix,
    commandEditableDuration: 10,
    nonCommandEditable: false,
})

// For registering the commands
bot.registry.registerDefaults();

bot.on('ready', async () => {
    if (bot.user == null) return
    console.log(`${bot.user.tag} is online`);
    await bot.user.setActivity('DM me for Help!', {type: "PLAYING"});
})

bot.login(config.token).catch(console.error)