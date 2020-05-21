const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileUtils = require('../utils/file-utils');
const _config = require('../config/config.json');

const _guildMembers = {};

function connectGuild(guildId) {
    var membersPath = fileUtils.getFullPath(`../data/${guildId}/members.json`);
    fileUtils.createIfNotExists(membersPath, JSON.stringify([]));
    var membersFile = new FileSync(membersPath);
    var membersDb = low(membersFile);
    _guildMembers[guildId] = membersDb;
}

function connectGuilds(guildIds) {
    for (var guildId of guildIds) {
        connectGuild(guildId);
    }
}

function getActiveMembers(guildId, members) {
    let savedMembers = _guildMembers[guildId].value();
    let activeGuildMembers = members.filter(member =>
        savedMembers.some(
            savedMember =>
                savedMember.id === member.id &&
                new Date() < addDays(new Date(savedMember.lastSetTime), _config.expireDays)
        )
    );
    return activeGuildMembers;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function setLastSetTime(guildId, memberId, lastSetTime) {
    if (_guildMembers[guildId].find({ id: memberId }).value()) {
        _guildMembers[guildId].find({ id: memberId }).assign({ lastSetTime: lastSetTime }).write();
    } else {
        _guildMembers[guildId].push({ id: memberId, lastSetTime: lastSetTime }).write();
    }
}

module.exports = {
    connectGuild,
    connectGuilds,
    getActiveMembers,
    setLastSetTime,
};
