import { DMChannel, GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Command } from './command';

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
                .setColor('#0099ff')
                .setDescription(
                    '**-orb members <server ID>** - Export server members. Ex: `-orb members 608826491068743690`'
                );

            await msg.channel.send(embed);
            return;
        }

        let guildId = args[2];
        let guild = msg.client.guilds.resolve(guildId);
        if (!guild) {
            await msg.channel.send(`Could not find a server with the ID "${guildId}".`);
            return;
        }

        let members = guild.members.cache.array().sort(this.compareMembers);
        let message = '';
        for (let member of members) {
            let line = `\`${member.user.tag}\` --- ${member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .sort()
                .join(', ')}`;
            line += '\n';
            if (message.length + line.length > MAX_MESSAGE_LENGTH) {
                await msg.channel.send(message);
                message = '';
            }
            message += line;
        }
        if (message.length > 1) {
            await msg.channel.send(message);
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
