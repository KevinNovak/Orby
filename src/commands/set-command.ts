import { ApplicationCommandData, CommandInteraction, GuildMember } from 'discord.js';

import { EventData } from '../models/internal-models';
import { MemberRepo } from '../repos';
import { Lang } from '../services';
import { MessageUtils, RegexUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

const MAX_NICKNAME_LENGTH = 32;

export class SetCommand implements Command {
    public static data: ApplicationCommandData = {
        name: 'set',
        description: 'Update your orb count.',
        options: [
            {
                name: 'claimed',
                description: 'Number of claimed orbs.',
                required: true,
                type: 4, // INTEGER
            },
            {
                name: 'inbox',
                description: 'Number of inbox orbs.',
                required: false,
                type: 4, // INTEGER
            },
        ],
    };
    public name = SetCommand.data.name;
    public requireGuild = true;
    public requirePerms = [];

    constructor(private memberRepo: MemberRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let member = intr.member as GuildMember;

        let claimedOrbs = intr.options.getInteger('claimed');
        if (claimedOrbs < 0 || claimedOrbs > Config.experience.maxOrbs) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation.invalidOrbCount', data.lang())
            );
            return;
        }

        let inboxOrbs = -1;
        if (intr.options.getInteger('inbox')) {
            inboxOrbs = intr.options.getInteger('inbox');
            if (inboxOrbs < 0 || inboxOrbs > Config.experience.maxOrbs) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation.invalidOrbCount', data.lang())
                );
                return;
            }
        }

        if (!intr.guild.me.permissions.has('MANAGE_NICKNAMES')) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation.nicknameNoPermission', data.lang())
            );
            return;
        }

        if (member.user.id === intr.guild.ownerId) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation.nicknameNoOwner', data.lang())
            );
            return;
        }

        if (intr.guild.me.roles.highest.position <= member.roles.highest.position) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation.nicknameHigherRole', data.lang())
            );
            return;
        }

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
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation.nicknameTooLong', data.lang())
            );
            return;
        }

        this.memberRepo.setLastSetTime(intr.guild.id, member.user.id, new Date().toISOString());
        await member.setNickname(displayName);

        if (inboxOrbs > 0) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results.orbCountUpdatedBoth', data.lang(), {
                    CLAIMED_ORBS: claimedOrbsString,
                    INBOX_ORBS: inboxOrbsString,
                })
            );
        } else {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results.orbCountUpdatedClaimed', data.lang(), {
                    CLAIMED_ORBS: claimedOrbsString,
                })
            );
        }
    }
}
