import { Collection, GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import { OrbData } from '../models/internal-models';
import { MemberRepo } from '../repos';
import { ArrayUtils, MathUtils, RegexUtils } from '../utils';

let Config = require('../../config/config.json');
let Lang = require('../../lang/lang.json');

const MAX_MESSAGE_LENGTH = 2000;

export class CommandService {
    constructor(private memberRepo: MemberRepo) {}

    public async processHelp(msg: Message): Promise<void> {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(Lang.msg.helpTitle)
            .setDescription(Lang.msg.help.join('\n'));

        await msg.channel.send(embed);
    }

    public async processTop(msg: Message, args: string[]): Promise<void> {
        if (!msg.guild) {
            await msg.channel.send(Lang.msg.notAllowedInDm);
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
                    orbCount: RegexUtils.extractUnclaimedOrbs(displayName) || 0,
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

        await msg.channel.send(embed);
    }

    public async processSet(msg: Message, args: string[]): Promise<void> {
        if (!msg.guild) {
            await msg.channel.send(Lang.msg.notAllowedInDm);
            return;
        }

        if (args.length < 3) {
            await msg.channel.send(Lang.msg.noOrbCountProvided);
            return;
        }

        let claimedOrbsFromUser = args[2];
        if (isNaN(+claimedOrbsFromUser)) {
            await msg.channel.send(Lang.msg.invalidOrbCount);
            return;
        }

        let newClaimedOrbs = parseInt(claimedOrbsFromUser);
        if (newClaimedOrbs < 0 || newClaimedOrbs > Config.experience.maxOrbs) {
            await msg.channel.send(Lang.msg.invalidOrbCount);
            return;
        }

        let newUnclaimedOrbs = -1;
        if (args.length >= 4) {
            let unclaimedOrbsFromUser = args[3];
            if (isNaN(+unclaimedOrbsFromUser)) {
                await msg.channel.send(Lang.msg.invalidOrbCount);
                return;
            }

            newUnclaimedOrbs = parseInt(unclaimedOrbsFromUser);
            if (newUnclaimedOrbs < 0 || newUnclaimedOrbs > Config.experience.maxOrbs) {
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
        let displayName = member.displayName;

        let claimedOrbsString = newClaimedOrbs.toLocaleString();
        let unclaimedOrbsString = newUnclaimedOrbs.toLocaleString();

        let newDisplayname = displayName;

        let currentClaimedOrbs = RegexUtils.extractClaimedOrbs(displayName);
        if (currentClaimedOrbs != null) {
            newDisplayname = RegexUtils.replaceClaimedOrbs(newDisplayname, claimedOrbsString);
        } else {
            newDisplayname = `${newDisplayname} (${claimedOrbsString})`;
        }

        if (newUnclaimedOrbs >= 0) {
            let currentUnclaimedOrbs = RegexUtils.extractUnclaimedOrbs(newDisplayname);
            if (currentUnclaimedOrbs) {
                newDisplayname = RegexUtils.replaceUnclaimedOrbs(
                    newDisplayname,
                    unclaimedOrbsString
                );
            } else {
                newDisplayname = RegexUtils.addUnclaimedOrbs(newDisplayname, unclaimedOrbsString);
            }
        } else {
            newDisplayname = RegexUtils.removeUnclaimedOrbs(newDisplayname);
        }

        if (newDisplayname.length > 32) {
            await msg.channel.send(Lang.msg.nicknameTooLong);
            return;
        }

        this.memberRepo.setLastSetTime(msg.guild.id, msg.author.id, new Date().toISOString());
        msg.member.setNickname(newDisplayname);

        if (newUnclaimedOrbs > 0) {
            await msg.channel.send(
                Lang.msg.updatedUnclaimedOrbCount
                    .replace('{CLAIMED_ORBS}', claimedOrbsString)
                    .replace('{UNCLAIMED_ORBS}', unclaimedOrbsString)
            );
        } else {
            await msg.channel.send(
                Lang.msg.updatedClaimedOrbCount.replace('{CLAIMED_ORBS}', claimedOrbsString)
            );
        }
    }

    public async processSay(msg: Message, args: string[]): Promise<void> {
        if (args.length < 5) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(
                    '**-orb say <server ID> <channel ID> <message>** - Make Orby send a message! Ex: `-orb say 608826491068743690 609767721395290130 Hello world!`'
                );

            await msg.channel.send(embed);
            return;
        }

        let guildId = args[2];
        let guild = msg.client.guilds.resolve(guildId);
        if (!guild) {
            await msg.channel.send(`Could not find a server with the ID "${guildId}".`);
            return;
        }

        let channelId = args[3];
        let channel = guild.channels.resolve(channelId);
        if (!channel) {
            await msg.channel.send(`Could not find a channel with the ID "${channelId}".`);
            return;
        }

        if (!(channel instanceof TextChannel)) {
            await msg.channel.send(`Channel is not a text channel!`);
            return;
        }

        let message = args.slice(4).join(' ');
        await channel.send(message);

        await msg.channel.send('Message sent!');
    }

    public async processMembers(msg: Message, args: string[]): Promise<void> {
        if (args.length < 3) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(
                    '**-orb members <server ID>** - Export server members. Ex: `-orb members 608826491068743690`'
                );

            await msg.channel.send(embed);
            return;
        }

        let guildId = args[2];
        let guild = msg.client.guilds.resolve(guildId);
        if (!guild) {
            await msg.channel.send(`Could not find a server with the ID "${guildId}".`);
            return;
        }

        let members = guild.members.cache.array().sort(this.compareMembers);
        let message = '';
        for (let member of members) {
            let line = `\`${member.user.tag}\` --- ${member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .sort()
                .join(', ')}`;
            line += '\n';
            if (message.length + line.length > MAX_MESSAGE_LENGTH) {
                await msg.channel.send(message);
                message = '';
            }
            message += line;
        }
        if (message.length > 1) {
            await msg.channel.send(message);
        }
    }

    private compareMembers(memberA: GuildMember, memberB: GuildMember): number {
        if (memberA.user.tag.toLowerCase() < memberB.user.tag.toLowerCase()) {
            return -1;
        }
        if (memberA.user.tag.toLowerCase() > memberB.user.tag.toLowerCase()) {
            return 1;
        }
        return 0;
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
