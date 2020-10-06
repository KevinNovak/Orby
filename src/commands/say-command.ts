import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

export class SayCommand implements Command {
    public name = 'say';
    public aliases = ['talk', 'speak'];
    public requireGuild = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: DMChannel | TextChannel
    ): Promise<void> {
        if (args.length < 5) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(
                    '**-orb say <server ID> <channel ID> <message>** - Make Orby send a message! Ex: `-orb say 608826491068743690 609767721395290130 Hello world!`'
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

        let channelId = args[3];
        let targetChannel = guild.channels.resolve(channelId);
        if (!targetChannel) {
            await MessageUtils.send(
                channel,
                `Could not find a channel with the ID "${channelId}".`
            );
            return;
        }

        if (!(targetChannel instanceof TextChannel)) {
            await MessageUtils.send(channel, `Channel is not a text channel!`);
            return;
        }

        let message = args.slice(4).join(' ');
        await MessageUtils.send(targetChannel, message);

        await MessageUtils.send(channel, 'Message sent!');
    }
}
