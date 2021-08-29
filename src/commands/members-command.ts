import { ApplicationCommandOptionType } from 'discord-api-types';
import { ApplicationCommandData, CommandInteraction, GuildMember } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

const MAX_MESSAGE_LENGTH = 2000;

export class MembersCommand implements Command {
    public static data: ApplicationCommandData = {
        name: 'members',
        description: '[Dev Only] Export server members and their roles.',
        options: [
            {
                name: 'server_id',
                description: 'ID of the server.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
            },
        ],
    };
    public name = MembersCommand.data.name;
    public requireDev = true;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let guildId = intr.options.getString('server_id');
        let guild = intr.client.guilds.resolve(guildId);
        if (!guild) {
            await MessageUtils.sendIntr(intr, `Could not find a server with the ID "${guildId}".`);
            return;
        }

        let members = [...(await guild.members.fetch()).values()].sort(this.compareMembers);
        let message = '';
        for (let member of members) {
            let line = `\`${member.user.tag}\` --- ${member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .sort()
                .join(', ')}`;
            line += '\n';
            if (message.length + line.length > MAX_MESSAGE_LENGTH) {
                await MessageUtils.sendIntr(intr, message);
                message = '';
            }
            message += line;
        }
        if (message.length > 1) {
            await MessageUtils.sendIntr(intr, message);
        }
    }

    private compareMembers(memberA: GuildMember, memberB: GuildMember): number {
        if (memberA.user.tag.toLowerCase() < memberB.user.tag.toLowerCase()) {
            return -1;
        }
        if (memberA.user.tag.toLowerCase() > memberB.user.tag.toLowerCase()) {
            return 1;
        }
        return 0;
    }
}
