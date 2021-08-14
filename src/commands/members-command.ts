import { DMChannel, GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

const MAX_MESSAGE_LENGTH = 2000;

export class MembersCommand implements Command {
    public name = 'members';
    public aliases = ['m', 'member', 'mem'];
    public requireGuild = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: DMChannel | TextChannel
    ): Promise<void> {
        if (args.length < 3) {
            const embed = new MessageEmbed()
                .setColor(Config.colors.default)
                .setDescription(
                    '**-orb members <server ID>** - Export server members. Ex: `-orb members 608826491068743690`'
                );

            await MessageUtils.send(channel, embed);
            return;
        }

        let guildId = args[2];
        let guild = msg.client.guilds.resolve(guildId);
        if (!guild) {
            await MessageUtils.send(channel, `Could not find a server with the ID "${guildId}".`);
            return;
        }

        let members = [...guild.members.cache.values()].sort(this.compareMembers);
        let message = '';
        for (let member of members) {
            let line = `\`${member.user.tag}\` --- ${member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .sort()
                .join(', ')}`;
            line += '\n';
            if (message.length + line.length > MAX_MESSAGE_LENGTH) {
                await MessageUtils.send(channel, message);
                message = '';
            }
            message += line;
        }
        if (message.length > 1) {
            await MessageUtils.send(channel, message);
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
