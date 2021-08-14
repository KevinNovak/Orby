import { Client, Options } from 'discord.js';

import { Bot } from './bot';
import {
    HelpCommand,
    InfoCommand,
    MembersCommand,
    SayCommand,
    SetCommand,
    TopCommand,
} from './commands';
import { GuildJoinHandler, GuildLeaveHandler, MessageHandler } from './events';
import { MemberRepo } from './repos';
import { Logger } from './services';

let Config = require('../config/config.json');

async function start(): Promise<void> {
    let client = new Client({
        intents: Config.client.intents,
        partials: Config.client.partials,
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.defaultMakeCacheSettings,
            // Override specific options from config
            ...Config.caches,
        }),
    });

    // Repos
    let memberRepo = new MemberRepo();

    // Commands
    let helpCommand = new HelpCommand();
    let infoCommand = new InfoCommand();
    let membersCommand = new MembersCommand();
    let sayCommand = new SayCommand();
    let setCommand = new SetCommand(memberRepo);
    let topCommand = new TopCommand(memberRepo);

    // Events handlers
    let guildJoinHandler = new GuildJoinHandler(memberRepo);
    let guildLeaveHandler = new GuildLeaveHandler();
    let messageHandler = new MessageHandler(Config.prefix, helpCommand, [
        infoCommand,
        membersCommand,
        sayCommand,
        setCommand,
        topCommand,
    ]);

    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        memberRepo
    );

    await bot.start();
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection.', reason);
});

start();
