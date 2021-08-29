import { Message } from 'discord.js';
import { Trigger } from '.';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

const OLD_COMMAND = '-orb';

export class OldCommandTrigger implements Trigger {
    public requireGuild = false;

    public triggered(msg: Message): boolean {
        return msg.content.split(' ')?.[0].toLowerCase() === OLD_COMMAND;
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        try {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('validation.oldCommandStyle', data.lang())
            );
        } catch (error) {
            // Ignore
        }
    }
}
