import { ApplicationCommandData, CommandInteraction, TextChannel } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class SayCommand implements Command {
    public static data: ApplicationCommandData = {
        name: 'say',
        description: 'Make Orby send a message!',
        options: [
            {
                name: 'server_id',
                description: 'Server ID',
                required: true,
                type: 3, // String
            },
            {
                name: 'channel_id',
                description: 'Channel ID',
                required: true,
                type: 3, // String
            },
            {
                name: 'message',
                description: 'Message',
                required: true,
                type: 3, // String
            },
        ],
    };
    public name = SayCommand.data.name;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let guildId = intr.options.getString('server_id');
        let guild = intr.client.guilds.resolve(guildId);
        if (!guild) {
            await MessageUtils.sendIntr(intr, `Could not find a server with the ID "${guildId}".`);
            return;
        }

        let channelId = intr.options.getString('channel_id');
        let targetChannel = guild.channels.resolve(channelId);
        if (!targetChannel) {
            await MessageUtils.sendIntr(
                intr,
                `Could not find a channel with the ID "${channelId}".`
            );
            return;
        }

        if (!(targetChannel instanceof TextChannel)) {
            await MessageUtils.sendIntr(intr, `Channel is not a text channel!`);
            return;
        }

        let message = intr.options.getString('message');
        await MessageUtils.send(targetChannel, message);

        await MessageUtils.sendIntr(intr, 'Message sent!');
    }
}
