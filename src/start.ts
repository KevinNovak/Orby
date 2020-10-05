import { Client } from 'discord.js';

import { Bot } from './bot';
import { GuildJoinHandler, GuildLeaveHandler, MessageHandler } from './events';
import { MemberRepo } from './repos';
import { Logger } from './services';
import { CommandService } from './services/command-service';

let Config = require('../config/config.json');

async function start(): Promise<void> {
    let client = new Client({
        ws: { intents: Config.client.intents },
        partials: Config.client.partials,
        messageCacheMaxSize: Config.client.caches.messages.size,
        messageCacheLifetime: Config.client.caches.messages.lifetime,
        messageSweepInterval: Config.client.caches.messages.sweepInterval,
    });

    // Repos
    let memberRepo = new MemberRepo();

    // Services
    let commandService = new CommandService(memberRepo);

    // Events handlers
    let guildJoinHandler = new GuildJoinHandler(memberRepo);
    let guildLeaveHandler = new GuildLeaveHandler();
    let messageHandler = new MessageHandler(commandService);

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
