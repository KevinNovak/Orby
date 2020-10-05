import { Guild } from 'discord.js';
import { MemberRepo } from '../repos';

import { Logger } from '../services';
import { EventHandler } from './event-handler';

let Logs = require('../../lang/logs.json');

export class GuildJoinHandler implements EventHandler {
    constructor(private memberRepo: MemberRepo) {}

    public async process(guild: Guild): Promise<void> {
        Logger.info(
            Logs.info.guildJoined
                .replace('{GUILD_NAME}', guild.name)
                .replace('{GUILD_ID}', guild.id)
        );
        this.memberRepo.connectGuild(guild.id);
    }
}
