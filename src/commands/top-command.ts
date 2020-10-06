import { Collection, DMChannel, GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';

import { OrbData } from '../models/internal-models';
import { MemberRepo } from '../repos';
import { ArrayUtils, MathUtils, MessageUtils, RegexUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');
let Lang = require('../../lang/lang.json');

export class TopCommand implements Command {
    public name = 'top';
    public aliases = ['t'];
    public requireGuild = true;

    constructor(private memberRepo: MemberRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: DMChannel | TextChannel
    ): Promise<void> {
        if (!msg.guild) {
            await MessageUtils.send(channel, Lang.msg.notAllowedInDm);
            return;
        }

        let topType = 'OVERALL';

        if (args.length >= 3) {
            if (args[2].toUpperCase() === 'INBOX') {
                topType = 'INBOX';
            }
        }

        let members: Collection<string, GuildMember>;
        try {
            members = this.memberRepo.getActiveMembers(msg.guild);
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
                Lang.msg.topFormat
                    .replace('{MEMBER_RANK}', rank.toLocaleString())
                    .replace('{ORB_COUNT}', data.orbCount.toLocaleString())
                    .replace('{MEMBER_NAME}', data.displayName)
            );
        }

        let pageSize = Config.experience.topPageSize;
        let maxPage = Math.ceil(lines.length / pageSize) || 1;
        let page = MathUtils.clamp(
            parseInt(topType === 'OVERALL' ? args[2] : args[3]) || 1,
            1,
            maxPage
        );

        let pageLines = ArrayUtils.paginate(lines, pageSize, page);
        let description = pageLines.join('\n') || 'No members!';
        let footer = `Page ${page.toLocaleString()} of ${maxPage.toLocaleString()}`;

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(
                topType === 'INBOX' ? Lang.msg.topSaversInboxTitle : Lang.msg.topSaversOverallTitle
            )
            .setDescription(description)
            .setFooter(footer);

        await MessageUtils.send(channel, embed);
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
