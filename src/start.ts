import { Options } from 'discord.js';

import { Bot } from './bot';
import { DevCommand, HelpCommand, SetCommand, TopCommand } from './commands';
import { SayCommand } from './commands/say-command';
import {
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { CustomClient } from './extensions';
import { MemberRepo } from './repos';
import { JobService, Logger } from './services';
import { OldCommandTrigger } from './triggers';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    let client = new CustomClient({
        intents: Config.client.intents,
        partials: Config.client.partials,
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.defaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });

    // Repos
    let memberRepo = new MemberRepo();

    // Commands
    let devCommand = new DevCommand();
    let helpCommand = new HelpCommand();
    let sayCommand = new SayCommand();
    let setCommand = new SetCommand(memberRepo);
    let topCommand = new TopCommand(memberRepo);

    // Triggers
    let oldCommandTrigger = new OldCommandTrigger();

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler(memberRepo);
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler([
        devCommand,
        helpCommand,
        sayCommand,
        setCommand,
        topCommand,
    ]);
    let triggerHandler = new TriggerHandler([oldCommandTrigger]);
    let messageHandler = new MessageHandler(triggerHandler);
    let reactionHandler = new ReactionHandler([]);

    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        reactionHandler,
        new JobService([]),
        memberRepo
    );

    await bot.start();
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
