import { Shard, ShardingManager } from 'discord.js';

import { Logger } from './services';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

export class Manager {
    constructor(private shardManager: ShardingManager) {}

    public async start(): Promise<void> {
        this.registerListeners();
        try {
            await this.shardManager.spawn({
                amount: this.shardManager.totalShards,
                delay: Config.sharding.spawnDelay * 1000,
                timeout: Config.sharding.spawnTimeout * 1000,
            });
        } catch (error) {
            Logger.error(Logs.error.spawnShard, error);
            return;
        }
    }

    private registerListeners(): void {
        this.shardManager.on('shardCreate', shard => this.onShardCreate(shard));
    }

    private onShardCreate(shard: Shard): void {
        Logger.info(Logs.info.launchedShard.replace('{SHARD_ID}', shard.id.toString()));
    }
}
