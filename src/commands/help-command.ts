import { ApplicationCommandData, CommandInteraction, MessageEmbed } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class HelpCommand implements Command {
    public static data: ApplicationCommandData = {
        name: 'help',
        description: 'Show help menu.',
    };
    public name = HelpCommand.data.name;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await MessageUtils.sendIntr(
            intr,
            new MessageEmbed({
                title: 'Orby - Help Menu',
                description: [
                    `Hi I'm Orby! Here are the things I help you with.`,
                    '',
                    '**/help** - Show this help menu.',
                    '**/set** - Update your orb count.',
                    '**/top** - Show the top orb savers.',
                ].join('\n'),
            }).setColor(Config.colors.default)
        );
    }
}
