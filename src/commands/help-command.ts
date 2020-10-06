import { DMChannel, Message, MessageEmbed, TextChannel } from 'discord.js';

import { MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');
let Lang = require('../../lang/lang.json');

export class HelpCommand implements Command {
    public name = 'help';
    public aliases = ['?'];
    public requireGuild = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: DMChannel | TextChannel
    ): Promise<void> {
        let embed = new MessageEmbed()
            .setColor(Config.colors.default)
            .setTitle(Lang.helpTitle)
            .setDescription(Lang.help.join('\n'));

        await MessageUtils.send(channel, embed);
    }
}
