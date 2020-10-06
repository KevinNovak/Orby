import { DMChannel, Message, TextChannel } from 'discord.js';

import { MemberRepo } from '../repos';
import { RegexUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');
let Lang = require('../../lang/lang.json');

const MAX_NICKNAME_LENGTH = 32;

export class SetCommand implements Command {
    public name = 'set';
    public aliases = ['s'];
    public requireGuild = true;

    constructor(private memberRepo: MemberRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: DMChannel | TextChannel
    ): Promise<void> {
        if (!msg.guild) {
            await msg.channel.send(Lang.msg.notAllowedInDm);
            return;
        }

        if (args.length < 3) {
            await msg.channel.send(Lang.msg.noOrbCountProvided);
            return;
        }

        let claimedOrbsInput = args[2];
        if (isNaN(+claimedOrbsInput)) {
            await msg.channel.send(Lang.msg.invalidOrbCount);
            return;
        }

        let claimedOrbs = parseInt(claimedOrbsInput);
        if (claimedOrbs < 0 || claimedOrbs > Config.experience.maxOrbs) {
            await msg.channel.send(Lang.msg.invalidOrbCount);
            return;
        }

        let inboxOrbs = -1;
        if (args.length >= 4) {
            let inboxOrbsInput = args[3];
            if (isNaN(+inboxOrbsInput)) {
                await msg.channel.send(Lang.msg.invalidOrbCount);
                return;
            }

            inboxOrbs = parseInt(inboxOrbsInput);
            if (inboxOrbs < 0 || inboxOrbs > Config.experience.maxOrbs) {
                await msg.channel.send(Lang.msg.invalidOrbCount);
                return;
            }
        }

        // If message came from a member of the guild
        if (!msg.member) {
            return;
        }

        if (!msg.guild.me.hasPermission('MANAGE_NICKNAMES')) {
            await msg.channel.send(Lang.msg.noPermissionChangeNickname);
            return;
        }

        if (msg.member.id === msg.guild.owner.id) {
            await msg.channel.send(Lang.msg.cantUpdateOwnerNickname);
            return;
        }

        if (msg.guild.me.roles.highest.position <= msg.member.roles.highest.position) {
            await msg.channel.send(Lang.msg.cantUpdateYourRole);
            return;
        }

        let member = msg.member;

        let claimedOrbsString = claimedOrbs.toLocaleString();
        let inboxOrbsString = inboxOrbs.toLocaleString();

        let currentClaimedOrbs = RegexUtils.extractClaimedOrbs(member.displayName);

        let displayName =
            currentClaimedOrbs != null
                ? RegexUtils.replaceClaimedOrbs(member.displayName, claimedOrbsString)
                : `${member.displayName} (${claimedOrbsString})`;

        if (inboxOrbs >= 0) {
            let currentInboxOrbs = RegexUtils.extractInboxOrbs(displayName);
            if (currentInboxOrbs) {
                displayName = RegexUtils.replaceInboxOrbs(displayName, inboxOrbsString);
            } else {
                displayName = RegexUtils.addInboxOrbs(displayName, inboxOrbsString);
            }
        } else {
            displayName = RegexUtils.removeInboxOrbs(displayName);
        }

        if (displayName.length > MAX_NICKNAME_LENGTH) {
            await msg.channel.send(Lang.msg.nicknameTooLong);
            return;
        }

        this.memberRepo.setLastSetTime(msg.guild.id, msg.author.id, new Date().toISOString());
        await msg.member.setNickname(displayName);

        if (inboxOrbs > 0) {
            await msg.channel.send(
                Lang.msg.updatedInboxOrbCount
                    .replace('{CLAIMED_ORBS}', claimedOrbsString)
                    .replace('{INBOX_ORBS}', inboxOrbsString)
            );
        } else {
            await msg.channel.send(
                Lang.msg.updatedClaimedOrbCount.replace('{CLAIMED_ORBS}', claimedOrbsString)
            );
        }
    }
}
