import { Client, Guild, Message } from 'discord.js';

import { GuildJoinHandler, GuildLeaveHandler, MessageHandler } from './events';
import { MemberRepo } from './repos';
import { Logger } from './services';

let Config = require('../config/config.json');
let Lang = require('../lang/lang.json');
let Logs = require('../lang/logs.json');

export class Bot {
    private ready = false;

    constructor(
        private token: string,
        private client: Client,
        private guildJoinHandler: GuildJoinHandler,
        private guildLeaveHandler: GuildLeaveHandler,
        private messageHandler: MessageHandler,
        private memberRepo: MemberRepo
    ) {}

    public async start(): Promise<void> {
        this.registerListeners();
        await this.login(this.token);
    }

    private registerListeners(): void {
        this.client.on('ready', () => this.onReady());
        this.client.on('shardReady', (shardId: number) => this.onShardReady(shardId));
        this.client.on('guildCreate', (guild: Guild) => this.onGuildJoin(guild));
        this.client.on('guildDelete', (guild: Guild) => this.onGuildLeave(guild));
        this.client.on('message', (msg: Message) => this.onMessage(msg));
    }

    private async login(token: string): Promise<void> {
        try {
            await this.client.login(token);
        } catch (error) {
            Logger.error(Logs.error.login, error);
            return;
        }
    }

    private async onReady(): Promise<void> {
        let userTag = this.client.user.tag;
        Logger.info(Logs.info.login.replace('{USER_TAG}', userTag));

        // Leave banned guilds
        for (let guild of this.client.guilds.cache.array()) {
            if (Config.experience.bannedServers.includes(guild.id)) {
                await guild.leave();
                console.info(`Left banned guild '${guild.name}' (${guild.id})!`);
            }
        }

        // Set presence
        this.client.user.setPresence({
            activity: {
                name: Lang.presence,
                type: 'PLAYING',
            },
        });

        this.memberRepo.connectGuilds(this.client.guilds.cache.keyArray());

        this.ready = true;
    }

    private onShardReady(shardId: number): void {
        Logger.setShardId(shardId);
    }

    private async onGuildJoin(guild: Guild): Promise<void> {
        if (!this.ready) {
            return;
        }

        try {
            await this.guildJoinHandler.process(guild);
        } catch (error) {
            Logger.error(Logs.error.guildJoin, error);
        }
    }

    private async onGuildLeave(guild: Guild): Promise<void> {
        if (!this.ready) {
            return;
        }

        try {
            await this.guildLeaveHandler.process(guild);
        } catch (error) {
            Logger.error(Logs.error.guildLeave, error);
        }
    }

    private async onMessage(msg: Message): Promise<void> {
        if (!this.ready) {
            return;
        }

        try {
            await this.messageHandler.process(msg);
        } catch (error) {
            Logger.error(Logs.error.message, error);
        }
    }
}
