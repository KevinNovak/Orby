import { ShardClientUtil, ShardingManager, Util } from 'discord.js';

export class ShardUtils {
    public static async getRecommendedShards(
        token: string,
        serversPerShard: number
    ): Promise<number> {
        return Math.ceil(
            await Util.fetchRecommendedShards(token, { guildsPerShard: serversPerShard })
        );
    }

    public static getMyShardIds(
        totalShards: number,
        machineId: number,
        totalMachines: number
    ): number[] {
        let myShardIds: number[] = [];
        for (let shardId = 0; shardId < totalShards; shardId++) {
            if (shardId % totalMachines === machineId) {
                myShardIds.push(shardId);
            }
        }
        return myShardIds;
    }

    public static async retrieveServerCount(
        shardInterface: ShardingManager | ShardClientUtil
    ): Promise<number> {
        let shardGuildCounts = (await shardInterface.fetchClientValues(
            'guilds.cache.size'
        )) as number[];
        return shardGuildCounts.reduce((prev, val) => prev + val, 0);
    }
}
