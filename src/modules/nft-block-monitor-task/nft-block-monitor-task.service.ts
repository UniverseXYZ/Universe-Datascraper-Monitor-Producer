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
  private readonly CURRENT_ARCHIVE_BLOCK = 'CURRENT_ARCHIVE_BLOCK';

  constructor(
    @InjectModel(NFTBlockMonitorTask.name)
    private readonly nftBlockMonitorTaskModel: Model<NFTBlockMonitorTaskDocument>,
  ) {}

  async insertLatestOne(blockNum: number, source: string) {
    await this.nftBlockMonitorTaskModel.insertMany({
      messageId: source === "MONITOR" ? this.CURRENT_MONITOR_BLOCK : this.CURRENT_ARCHIVE_BLOCK,
      blockNum,
      status: 'sent',
    });
  }

  async updateLatestOne(blockNum: number, source: string) {
    await this.nftBlockMonitorTaskModel.updateOne(
      { messageId: source === "MONITOR" ? this.CURRENT_MONITOR_BLOCK : this.CURRENT_ARCHIVE_BLOCK },
      { blockNum },
    );
  }

  async getLatestOne(source: string) {
    return await this.nftBlockMonitorTaskModel.findOne({
      messageId: source === "MONITOR" ? this.CURRENT_MONITOR_BLOCK : this.CURRENT_ARCHIVE_BLOCK,
    });
  }

  async getRetryBlock(source: string) {
    return await this.nftBlockMonitorTaskModel.findOne({
      messageId: source === "MONITOR" ? this.CURRENT_MONITOR_BLOCK : this.CURRENT_ARCHIVE_BLOCK,
      status: 'retry',
    });
  }

  public async deleteOne(messageId: string) {
    await this.nftBlockMonitorTaskModel.deleteOne({ messageId });
  }
}
