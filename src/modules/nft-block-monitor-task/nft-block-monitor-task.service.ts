import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NFTBlockMonitorTask,
  NFTBlockMonitorTaskDocument,
} from './schemas/nft-block-monitor-task.schema';

@Injectable()
export class NFTBlockMonitorTaskService {
  private readonly CURRENT_MONITOR_BLOCK = 'CURRENT_MONITOR_BLOCK';

  constructor(
    @InjectModel(NFTBlockMonitorTask.name)
    private readonly nftBlockMonitorTaskModel: Model<NFTBlockMonitorTaskDocument>,
  ) {}

  async insertLatestOne(blockNum: number) {
    await this.nftBlockMonitorTaskModel.insertMany({
      messageId: this.CURRENT_MONITOR_BLOCK,
      blockNum,
      status: 'sent',
    });
  }

  async updateLatestOne(blockNum: number) {
    await this.nftBlockMonitorTaskModel.updateOne(
      { messageId: this.CURRENT_MONITOR_BLOCK },
      { blockNum },
    );
  }

  async getLatestOne() {
    return await this.nftBlockMonitorTaskModel.findOne({
      messageId: this.CURRENT_MONITOR_BLOCK,
    });
  }

  async getRetryBlock() {
    return await this.nftBlockMonitorTaskModel.findOne({
      status: 'retry',
    });
  }

  public async deleteOne(messageId: string) {
    await this.nftBlockMonitorTaskModel.deleteOne({ messageId });
  }
}
