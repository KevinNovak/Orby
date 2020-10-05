import { Collection, Guild, GuildMember } from 'discord.js';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

import { FileUtils } from '../utils';

let Config = require('../../config/config.json');

export class MemberRepo {
    private guildMembers: { [guildId: string]: any } = {};

    public connectGuild(guildId: string): void {
        let membersPath = FileUtils.getFullPath(`../../data/${guildId}/members.json`);
        FileUtils.createIfNotExists(membersPath, JSON.stringify([]));
        let membersFile = new FileSync(membersPath);
        let membersDb = low(membersFile);
        this.guildMembers[guildId] = membersDb;
    }

    public connectGuilds(guildIds: string[]): void {
        for (let guildId of guildIds) {
            this.connectGuild(guildId);
        }
    }

    public getActiveMembers(guild: Guild): Collection<string, GuildMember> {
        let members = guild.members.cache;
        let savedMembers = this.guildMembers[guild.id].value();
        let activeMembers = members.filter(
            member =>
                savedMembers.some(
                    savedMember =>
                        savedMember.id === member.id &&
                        new Date() <
                            this.addDays(
                                new Date(savedMember.lastSetTime),
                                Config.experience.expireDays
                            )
                ) || member.id === guild.ownerID
        );
        return activeMembers;
    }

    public setLastSetTime(guildId: string, memberId: string, lastSetTime: string): void {
        if (this.guildMembers[guildId].find({ id: memberId }).value()) {
            this.guildMembers[guildId].find({ id: memberId }).assign({ lastSetTime }).write();
        } else {
            this.guildMembers[guildId].push({ id: memberId, lastSetTime }).write();
        }
    }

    private addDays(date: Date, days: number): Date {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}
