const _regexUtils = require("../utils/regex-utils");
const _config = require("../config/config.json");
const _lang = require("../config/lang.json");

const Discord = require("discord.js");

let _helpMsg = _lang.msg.help.join("\n");

let MAX_MESSAGE_LENGTH = 2000;

function processHelp(msg) {
    const embed = new Discord.MessageEmbed()
        .setColor("#0099ff")
        .setTitle(_lang.msg.helpTitle)
        .setDescription(_helpMsg);

    msg.channel.send(embed);
}

async function processTop(msg, args) {
    if (!msg.guild) {
        msg.channel.send(_lang.msg.notAllowedInDm);
        return;
    }

    let topType = "OVERALL";

    if (args.length >= 3) {
        if (args[2].toUpperCase() == "INBOX") {
            topType = "INBOX";
        }
    }

    let members = [];
    try {
        members = await msg.guild.members.fetch();
    } catch (error) {
        return;
    }

    let displayNames = members
        .filter((member) => !member.user.bot)
        .map((member) => member.displayName);

    let orbData = [];
    if (topType == "INBOX") {
        orbData = displayNames
            .filter(_regexUtils.containsOrbs)
            .map((displayName) => ({
                displayName,
                totalOrbs: _regexUtils.extractUnclaimedOrbs(displayName) || 0,
            }))
            .filter((orbData) => orbData.totalOrbs > 0)
            .sort(compareOrbCounts)
            .slice(0, _config.topCount);
    } else {
        orbData = displayNames
            .filter(_regexUtils.containsOrbs)
            .map((displayName) => ({
                displayName,
                totalOrbs: _regexUtils.extractTotalOrbs(displayName) || 0,
            }))
            .filter((orbData) => orbData.totalOrbs > 0)
            .sort(compareOrbCounts)
            .slice(0, _config.topCount);
    }

    let description = "";
    for (let [index, data] of orbData.entries()) {
        let rank = index + 1;
        description +=
            _lang.msg.topFormat
                .replace("{MEMBER_RANK}", rank)
                .replace("{MEMBER_NAME}", data.displayName) + "\n";
    }

    const embed = new Discord.MessageEmbed()
        .setColor("#0099ff")
        .setTitle(
            topType == "INBOX"
                ? _lang.msg.topHoardersInboxTitle
                : _lang.msg.topHoardersOverallTitle
        )
        .setDescription(description);

    msg.channel.send(embed);
}

function processSet(msg, args) {
    if (!msg.guild) {
        msg.channel.send(_lang.msg.notAllowedInDm);
        return;
    }

    if (args.length < 3) {
        msg.channel.send(_lang.msg.noOrbCountProvided);
        return;
    }

    let claimedOrbsFromUser = args[2];
    if (isNaN(claimedOrbsFromUser)) {
        msg.channel.send(_lang.msg.invalidOrbCount);
        return;
    }

    let newClaimedOrbs = parseInt(claimedOrbsFromUser);
    if (newClaimedOrbs < 0 || newClaimedOrbs > _config.maxOrbs) {
        msg.channel.send(_lang.msg.invalidOrbCount);
        return;
    }

    let newUnclaimedOrbs = -1;
    if (args.length >= 4) {
        let unclaimedOrbsFromUser = args[3];
        if (isNaN(unclaimedOrbsFromUser)) {
            msg.channel.send(_lang.msg.invalidOrbCount);
            return;
        }

        newUnclaimedOrbs = parseInt(unclaimedOrbsFromUser);
        if (newUnclaimedOrbs < 0 || newUnclaimedOrbs > _config.maxOrbs) {
            msg.channel.send(_lang.msg.invalidOrbCount);
            return;
        }
    }

    // If message came from a member of the guild
    if (!msg.member) {
        return;
    }

    if (!msg.guild.me.hasPermission("MANAGE_NICKNAMES")) {
        msg.channel.send(_lang.msg.noPermissionChangeNickname);
        return;
    }

    if (msg.member.id === msg.guild.owner.id) {
        msg.channel.send(_lang.msg.cantUpdateOwnerNickname);
        return;
    }

    if (
        msg.guild.me.roles.highest.position <= msg.member.roles.highest.position
    ) {
        msg.channel.send(_lang.msg.cantUpdateYourRole);
        return;
    }

    let member = msg.member;
    let displayName = member.displayName;

    let claimedOrbsString = newClaimedOrbs.toLocaleString();
    let unclaimedOrbsString = newUnclaimedOrbs.toLocaleString();

    let newDisplayname = displayName;

    let currentClaimedOrbs = _regexUtils.extractClaimedOrbs(displayName);
    if (currentClaimedOrbs != null) {
        newDisplayname = _regexUtils.replaceClaimedOrbs(
            newDisplayname,
            claimedOrbsString
        );
    } else {
        newDisplayname = `${newDisplayname} (${claimedOrbsString})`;
    }

    if (newUnclaimedOrbs >= 0) {
        let currentUnclaimedOrbs = _regexUtils.extractUnclaimedOrbs(
            newDisplayname
        );
        if (currentUnclaimedOrbs) {
            newDisplayname = _regexUtils.replaceUnclaimedOrbs(
                newDisplayname,
                unclaimedOrbsString
            );
        } else {
            newDisplayname = _regexUtils.addUnclaimedOrbs(
                newDisplayname,
                unclaimedOrbsString
            );
        }
    } else {
        newDisplayname = _regexUtils.removeUnclaimedOrbs(newDisplayname);
    }

    if (newDisplayname.length > 32) {
        msg.channel.send(_lang.msg.nicknameTooLong);
        return;
    }

    msg.member.setNickname(newDisplayname);

    if (newUnclaimedOrbs > 0) {
        msg.channel.send(
            _lang.msg.updatedUnclaimedOrbCount
                .replace("{CLAIMED_ORBS}", claimedOrbsString)
                .replace("{UNCLAIMED_ORBS}", unclaimedOrbsString)
        );
    } else {
        msg.channel.send(
            _lang.msg.updatedClaimedOrbCount.replace(
                "{CLAIMED_ORBS}",
                claimedOrbsString
            )
        );
    }
}

function processSay(msg, args, guilds) {
    if (args.length < 5) {
        const embed = new Discord.MessageEmbed()
            .setColor("#0099ff")
            .setDescription(
                "**-orb say <server ID> <channel ID> <message>** - Make Orby send a message! Ex: `-orb say 608826491068743690 609767721395290130 Hello world!`"
            );

        msg.channel.send(embed);
        return;
    }

    let guildId = args[2];
    let guild = guilds.resolve(guildId);
    if (!guild) {
        msg.channel.send(`Could not find a server with the ID "${guildId}".`);
        return;
    }

    let channelId = args[3];
    let channel = guild.channels.resolve(channelId);
    if (!channel) {
        msg.channel.send(
            `Could not find a channel with the ID "${channelId}".`
        );
        return;
    }

    let message = args.slice(4).join(" ");
    channel.send(message);

    msg.channel.send("Message sent!");
}

function processMembers(msg, args, guilds) {
    if (args.length < 3) {
        const embed = new Discord.MessageEmbed()
            .setColor("#0099ff")
            .setDescription(
                "**-orb members <server ID>** - Export server members. Ex: `-orb members 608826491068743690`"
            );

        msg.channel.send(embed);
        return;
    }

    let guildId = args[2];
    let guild = guilds.resolve(guildId);
    if (!guild) {
        msg.channel.send(`Could not find a server with the ID "${guildId}".`);
        return;
    }

    let members = guild.members.cache.array().sort(compareMembers);
    let message = "";
    for (let member of members) {
        let line = `**${member.user.tag}**: ${member.roles.cache
            .filter((role) => role.name != "@everyone")
            .map((role) => role.name)
            .sort()
            .join(", ")}`;
        line += "\n";
        if (message.length + line.length > MAX_MESSAGE_LENGTH) {
            msg.channel.send(message);
            message = "";
        }
        message += line;
    }
    if (message.length > 1) {
        msg.channel.send(message);
    }
}

function compareMembers(memberA, memberB) {
    if (memberA.user.tag < memberB.user.tag) {
        return -1;
    }
    if (memberA.user.tag > memberB.user.tag) {
        return 1;
    }
    return 0;
}

function compareOrbCounts(a, b) {
    if (a.totalOrbs > b.totalOrbs) {
        return -1;
    }
    if (a.totalOrbs < b.totalOrbs) {
        return 1;
    }
    return 0;
}

module.exports = {
    processHelp,
    processSet,
    processTop,
    processSay,
    processMembers,
};
