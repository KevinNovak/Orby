const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileUtils = require('../utils/file-utils');

const guildMembers = {};

function connectGuild(guildId) {
    var membersPath = fileUtils.getFullPath(`../data/${guildId}/members.json`);
    fileUtils.createIfNotExists(membersPath, JSON.stringify([]));
    var membersFile = new FileSync(membersPath);
    var membersDb = low(membersFile);
    guildMembers[guildId] = membersDb;
}

function connectGuilds(guildIds) {
    for (var guildId of guildIds) {
        connectGuild(guildId);
    }
}

function getActiveMembers(guildId, memberIds) {
    return memberIds[guildId].filter(
        member => memberIds.includes(member.id) && member.lastSetTime > null
    );
}

function setLastSetTime(guildId, memberId, lastSetTime) {
    if (guildMembers[guildId].find({ id: memberId }).value()) {
        guildMembers[guildId].find({ id: memberId }).assign({ lastSetTime: lastSetTime }).write();
    } else {
        guildMembers[guildId].push({ id: memberId, lastSetTime: lastSetTime }).write();
    }
}

module.exports = {
    connectGuild,
    connectGuilds,
    getActiveMembers,
    setLastSetTime,
};
