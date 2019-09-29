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
        .filter(_regexUtils.containsOrbCount)
        .map(displayName => ({
            displayName,
            orbCount: _regexUtils.extractOrbCount(displayName)
        }))
        .sort(compareOrbCounts)
        .reverse()
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

    let newOrbCountString = args[2];
    if (isNaN(newOrbCountString)) {
        msg.channel.send(_lang.msg.invalidOrbCount);
        return;
    }

    let newOrbCount = parseInt(newOrbCountString);
    if (newOrbCount < 0 || newOrbCount > _config.maxOrbs) {
        msg.channel.send(_lang.msg.invalidOrbCount);
        return;
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

    let orbCountString = newOrbCount.toLocaleString();
    let newDisplayname = displayName;
    if (_regexUtils.containsOrbCount(displayName)) {
        newDisplayname = _regexUtils.replaceOrbCount(displayName, newOrbCountString);
    } else {
        newDisplayname = `${displayName} (${orbCountString})`
    }

    if (newDisplayname.length > 32) {
        msg.channel.send(_lang.msg.nicknameTooLong);
        return;
    }

    msg.member.setNickname(newDisplayname);

    msg.channel.send(_lang.msg.updatedOrbCount.replace('{ORB_COUNT}', orbCountString));
}

function compareOrbCounts(a, b) {
    if (a.orbCount > b.orbCount) {
        return 1;
    }
    if (a.orbCount < b.orbCount) {
        return -1;
    }
    return 0;
}

module.exports = {
    processHelp,
    processSet,
    processTop
};
