import {
    ApplicationCommandData,
    Collection,
    CommandInteraction,
    GuildMember,
    MessageEmbed,
} from 'discord.js';

import { EventData, OrbData } from '../models/internal-models';
import { MemberRepo } from '../repos';
import { Lang } from '../services';
import { ArrayUtils, MathUtils, MessageUtils, RegexUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class TopCommand implements Command {
    public static data: ApplicationCommandData = {
        name: 'top',
        description: 'Show the top orb savers.',
        options: [
            {
                name: 'type',
                description: 'Type of orbs.',
                required: false,
                type: 3, // String
                choices: [
                    {
                        name: 'overall',
                        value: 'OVERALL',
                    },
                    {
                        name: 'inbox',
                        value: 'INBOX',
                    },
                ],
            },
            {
                name: 'page',
                description: 'Page number.',
                required: false,
                type: 4, // Integer
            },
        ],
    };
    public name = TopCommand.data.name;
    public requireGuild = true;
    public requirePerms = [];

    constructor(private memberRepo: MemberRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let topType = intr.options.getString('type') ?? 'OVERALL';

        let members: Collection<string, GuildMember>;
        try {
            members = this.memberRepo.getActiveMembers(intr.guild);
        } catch (error) {
            return;
        }

        let displayNames = members
            .filter(member => !member.user.bot)
            .map(member => member.displayName);

        let orbData = [];
        if (topType === 'INBOX') {
            orbData = displayNames
                .filter(RegexUtils.containsOrbs)
                .map(displayName => ({
                    displayName,
                    orbCount: RegexUtils.extractInboxOrbs(displayName) || 0,
                }))
                .filter(orbData => orbData.orbCount > 0)
                .sort(this.compareOrbCounts);
        } else {
            orbData = displayNames
                .filter(RegexUtils.containsOrbs)
                .map(displayName => ({
                    displayName,
                    orbCount: RegexUtils.extractTotalOrbs(displayName) || 0,
                }))
                .filter(orbData => orbData.orbCount > 0)
                .sort(this.compareOrbCounts);
        }

        let lines = [];
        for (let [index, data] of orbData.entries()) {
            let rank = index + 1;
            lines.push(
                Lang.getRef('lists.topItem', Lang.Default, {
                    MEMBER_RANK: rank.toLocaleString(),
                    ORB_COUNT: data.orbCount.toLocaleString(),
                    MEMBER_NAME: data.displayName,
                })
            );
        }

        let pageSize = Config.experience.topPageSize;
        let maxPage = Math.ceil(lines.length / pageSize) || 1;
        let page = MathUtils.clamp(intr.options.getInteger('page') || 1, 1, maxPage);

        let pageLines = ArrayUtils.paginate(lines, pageSize, page);
        let description = pageLines.join('\n') || Lang.getRef('lists.topNone', Lang.Default);
        let footer = `Page ${page.toLocaleString()} of ${maxPage.toLocaleString()}`;

        const embed = new MessageEmbed()
            .setColor(Config.colors.default)
            .setTitle(topType === 'INBOX' ? 'Top Orb Savers - Inbox' : 'Top Orb Savers - Overall')
            .setDescription(description)
            .setFooter(footer);

        await MessageUtils.sendIntr(intr, embed);
    }

    private compareOrbCounts(a: OrbData, b: OrbData): number {
        if (a.orbCount > b.orbCount) {
            return -1;
        }
        if (a.orbCount < b.orbCount) {
            return 1;
        }
        return 0;
    }
}
