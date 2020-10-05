import { Message } from 'discord.js';
import { CommandService } from '../services/command-service';

let Config = require('../../config/config.json');
let Lang = require('../../lang/lang.json');

export class MessageHandler {
    constructor(private commandService: CommandService) {}

    public async process(msg: Message): Promise<void> {
        if (msg.author.bot || !this.canReply(msg)) {
            return;
        }

        let args = msg.content.split(' ');
        if (!Lang.cmd.prefix.includes(args[0].toLowerCase())) {
            return;
        }

        if (args.length > 1) {
            let cmd = args[1].toLowerCase();
            if (Lang.cmd.help.includes(cmd)) {
                await this.commandService.processHelp(msg);
                return;
            }

            if (Lang.cmd.set.includes(cmd)) {
                await this.commandService.processSet(msg, args);
                return;
            }

            if (Lang.cmd.top.includes(cmd)) {
                await this.commandService.processTop(msg, args);
                return;
            }

            if (
                Lang.cmd.say.includes(cmd) &&
                !msg.guild &&
                Config.experience.owners.includes(msg.author.id)
            ) {
                await this.commandService.processSay(msg, args);
                return;
            }

            if (
                Lang.cmd.members.includes(cmd) &&
                !msg.guild &&
                Config.experience.owners.includes(msg.author.id)
            ) {
                await this.commandService.processMembers(msg, args);
                return;
            }
        }

        await this.commandService.processHelp(msg);
    }

    private canReply(msg): boolean {
        return msg.guild ? msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES') : true;
    }
}
