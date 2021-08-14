import { DMChannel, Message, TextChannel } from 'discord.js';

import { MemberRepo } from '../repos';
import { MessageUtils, RegexUtils } from '../utils';
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
            await MessageUtils.send(channel, Lang.notAllowedInDm);
            return;
        }

        if (args.length < 3) {
            await MessageUtils.send(channel, Lang.noOrbCountProvided);
            return;
        }

        let claimedOrbsInput = args[2];
        if (isNaN(+claimedOrbsInput)) {
            await MessageUtils.send(channel, Lang.invalidOrbCount);
            return;
        }

        let claimedOrbs = parseInt(claimedOrbsInput);
        if (claimedOrbs < 0 || claimedOrbs > Config.experience.maxOrbs) {
            await MessageUtils.send(channel, Lang.invalidOrbCount);
            return;
        }

        let inboxOrbs = -1;
        if (args.length >= 4) {
            let inboxOrbsInput = args[3];
            if (isNaN(+inboxOrbsInput)) {
                await MessageUtils.send(channel, Lang.invalidOrbCount);
                return;
            }

            inboxOrbs = parseInt(inboxOrbsInput);
            if (inboxOrbs < 0 || inboxOrbs > Config.experience.maxOrbs) {
                await MessageUtils.send(channel, Lang.invalidOrbCount);
                return;
            }
        }

        // If message came from a member of the guild
        if (!msg.member) {
            return;
        }

        if (!msg.guild.me.permissions.has('MANAGE_NICKNAMES')) {
            await MessageUtils.send(channel, Lang.noPermissionChangeNickname);
            return;
        }

        if (msg.member.id === msg.guild.ownerId) {
            await MessageUtils.send(channel, Lang.cantUpdateOwnerNickname);
            return;
        }

        if (msg.guild.me.roles.highest.position <= msg.member.roles.highest.position) {
            await MessageUtils.send(channel, Lang.cantUpdateYourRole);
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
            await MessageUtils.send(channel, Lang.nicknameTooLong);
            return;
        }

        this.memberRepo.setLastSetTime(msg.guild.id, msg.author.id, new Date().toISOString());
        await msg.member.setNickname(displayName);

        if (inboxOrbs > 0) {
            await msg.channel.send(
                Lang.updatedInboxOrbCount
                    .replace('{CLAIMED_ORBS}', claimedOrbsString)
                    .replace('{INBOX_ORBS}', inboxOrbsString)
            );
        } else {
            await msg.channel.send(
                Lang.updatedClaimedOrbCount.replace('{CLAIMED_ORBS}', claimedOrbsString)
            );
        }
    }
}
