import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

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

            await msg.channel.send(embed);
            return;
        }

        let guildId = args[2];
        let guild = msg.client.guilds.resolve(guildId);
        if (!guild) {
            await msg.channel.send(`Could not find a server with the ID "${guildId}".`);
            return;
        }

        let channelId = args[3];
        let targetChannel = guild.channels.resolve(channelId);
        if (!targetChannel) {
            await msg.channel.send(`Could not find a channel with the ID "${channelId}".`);
            return;
        }

        if (!(targetChannel instanceof TextChannel)) {
            await msg.channel.send(`Channel is not a text channel!`);
            return;
        }

        let message = args.slice(4).join(' ');
        await targetChannel.send(message);

        await msg.channel.send('Message sent!');
    }
}
