const _regexUtils = require('../utils/regex-utils');
const _config = require('../config/config.json');
const _lang = require('../config/lang.json');

const Discord = require('discord.js');

let _helpMsg = _lang.msg.help.join('\n');

function processHelp(msg) {
    msg.channel.send(_helpMsg);
}

function processTop(msg) {
    if (!msg.guild) {
        msg.channel.send(_lang.msg.notAllowedInDm);
        return;
    }

    let displayNames = msg.guild.members
        .filter(member => !member.user.bot)
        .map(member => member.displayName);

    let orbData = displayNames
        .filter(_regexUtils.containsOrbs)
        .map(displayName => ({
            displayName,
            totalOrbs: _regexUtils.extractTotalOrbs(displayName)
        }))
        .sort(compareOrbCounts)
        .slice(0, _config.topCount);

    let description = ''
    for (let [index, data] of orbData.entries()) {
        let rank = index + 1;
        description += _lang.msg.topFormat
            .replace('{MEMBER_RANK}', rank)
            .replace('{MEMBER_NAME}', data.displayName) + '\n';
    }

    const embed = new Discord.RichEmbed()
        .setColor('#0099ff')
        .setTitle(_lang.msg.topTitle)
        .setDescription(description)

    msg.channel.send(embed);
};

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

    let newUnclaimedOrbs = 0;
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

    if (msg.member.id === msg.guild.owner.id) {
        msg.channel.send(_lang.msg.cantUpdateOwnerNickname);
        return;
    }

    if (!msg.guild.me.hasPermission('MANAGE_NICKNAMES')) {
        msg.channel.send(_lang.msg.noPermissionChangeNickname);
        return;
    };

    let member = msg.member;
    let displayName = member.displayName;

    let claimedOrbsString = newClaimedOrbs.toLocaleString();
    let unclaimedOrbsString = newUnclaimedOrbs.toLocaleString();

    let newDisplayname = displayName;

    let currentClaimedOrbs = _regexUtils.extractClaimedOrbs(displayName);
    if (currentClaimedOrbs) {
        newDisplayname = _regexUtils.replaceClaimedOrbs(newDisplayname, claimedOrbsString);
    } else {
        newDisplayname = `${newDisplayname} (${claimedOrbsString})`
    }

    if (newUnclaimedOrbs > 0) {
        let currentUnclaimedOrbs = _regexUtils.extractUnclaimedOrbs(newDisplayname);
        if (currentUnclaimedOrbs) {
            newDisplayname = _regexUtils.replaceUnclaimedOrbs(newDisplayname, unclaimedOrbsString);
        } else {
            newDisplayname = _regexUtils.addUnclaimedOrbs(newDisplayname, unclaimedOrbsString);
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
                .replace('{CLAIMED_ORBS}', claimedOrbsString)
                .replace('{UNCLAIMED_ORBS}', unclaimedOrbsString)
        );
    } else {
        msg.channel.send(
            _lang.msg.updatedClaimedOrbCount
                .replace('{CLAIMED_ORBS}', claimedOrbsString)
        );
    }
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
    processTop
};
