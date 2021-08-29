import { ApplicationCommandOptionType } from 'discord-api-types';
import { ApplicationCommandData, CommandInteraction, TextChannel } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class SayCommand implements Command {
    public static data: ApplicationCommandData = {
        name: 'say',
        description: 'Send a message as Orby.',
        options: [
            {
                name: 'server_id',
                description: 'ID of the server.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
            },
            {
                name: 'channel_id',
                description: 'ID of the channel.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
            },
            {
                name: 'message',
                description: 'Message to send.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
            },
        ],
    };
    public name = SayCommand.data.name;
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
