import { Message, MessageEmbed } from 'discord.js';
import { Trigger } from '.';
import { EventData } from '../models/internal-models';
import { MessageUtils } from '../utils';

export class OldCommandTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return msg.content.split(' ')?.[0].toLowerCase() === '-orb';
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        try {
            await MessageUtils.send(
                msg.channel,
                new MessageEmbed({
                    description: 'Orby now uses **Slash Commands**!\n\nTry it by typing `/help`!',
                    color: '#ffcc66',
                })
            );
        } catch (error) {
            // Ignore
        }
    }
}
