const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fileUtils = require('../utils/file-utils');

const users = {};

function connectServer(serverId) {
    var usersPath = fileUtils.getFullPath(`../data/${serverId}/users.json`);
    fileUtils.createIfNotExists(usersPath, JSON.stringify([]));
    var usersFile = new FileSync(usersPath);
    var usersDb = low(usersFile);
    users[serverId] = usersDb;
}

function connectServers(serverIds) {
    for (var serverId of serverIds) {
        connectServer(serverId);
    }
}

function getActiveUsers(serverId, guildUsers) {
    return users[serverId].filter(user => guildUsers.includes(user.id) && user.lastSetTime > null);
}

function setLastSetTime(serverId, userId, lastSetTime) {
    if (users[serverId].find({ id: userId }).value()) {
        users[serverId].find({ id: userId }).assign({ lastSetTime: lastSetTime }).write();
    } else {
        users[serverId].push({ id: userId, lastSetTime: lastSetTime }).write();
    }
}

module.exports = {
    connectServer,
    connectServers,
    getActiveUsers,
    setLastSetTime,
};
