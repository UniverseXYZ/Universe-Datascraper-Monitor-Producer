import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Producer } from 'sqs-producer';
import AWS from 'aws-sdk';
import {
  Message,
  QueueMessageBody,
  SqsProducerHandler,
} from './sqs-producer.types';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EthereumService } from '../ethereum/ethereum.service';
import { NFTBlockMonitorTaskService } from '../nft-block-monitor-task/nft-block-monitor-task.service';

@Injectable()
export class SqsProducerService implements OnModuleInit, SqsProducerHandler {
  public sqsProducer: Producer;
  private readonly logger = new Logger(SqsProducerService.name);
  nextBlock: number;
  private readonly source: string;
  private readonly queueLimit: number;

  constructor(
    private configService: ConfigService,
    private readonly nftBlockMonitorService: NFTBlockMonitorTaskService,
    private readonly ethereumService: EthereumService,
  ) {
    const region = this.configService.get('aws.region');
    const accessKeyId = this.configService.get('aws.accessKeyId');
    const secretAccessKey = this.configService.get('aws.secretAccessKey');
    const source = this.configService.get('source');
    const queueLimit = Number(this.configService.get('queueLimit'));

    if (!region || !accessKeyId || !secretAccessKey || !source || !queueLimit) {
      throw new Error(
        'Initialize AWS queue failed, please check required variables',
      );
    }

    if (source !== 'ARCHIVE' && source !== 'MONITOR') {
      throw new Error(`SOURCE has invalid value(${source})`);
    }

    this.source = source;
    this.queueLimit = queueLimit;

    AWS.config.update({
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    });
  }

  public onModuleInit() {
    this.sqsProducer = Producer.create({
      queueUrl: this.configService.get('aws.queueUrl'),
      sqs: new AWS.SQS(),
    });
  }

  /**
   * #1. check latest block number
   * #2. send to queue
   * #3. save tasks to DB
   * #4. mark collection as processed
   */
  // TODO: Upgrade this code in order to support backwards flow
  @Cron('*/10 * * * * *')
  public async checkBlock() {
    // Check if there is any unprocessed collection
    const currentBlock = await this.ethereumService.getBlockNum();
    const blockDelay = parseInt(this.configService.get('blockDelay'));

    for (let i = 0; i < this.queueLimit; i++) {
      const lastBlock = await this.nftBlockMonitorService.getLatestOne(
        this.source,
      );

      if (!lastBlock) {
        this.nextBlock = parseInt(
          this.configService.get('default_start_block'),
        );
        this.logger.log(
          `[Block Monitor Producer - ${this.source}] Havent started yet, will be start with the default block number: ${this.nextBlock}`,
        );
        await this.nftBlockMonitorService.insertLatestOne(
          this.nextBlock,
          this.source,
        );
      } else {
        // TODO: check if we should use BigNumber here
        this.nextBlock =
          this.source === 'MONITOR'
            ? lastBlock.blockNum + 1
            : lastBlock.blockNum - 1;
      }

      if (
        this.source === 'MONITOR' &&
        this.nextBlock > currentBlock - blockDelay
      ) {
        this.logger.log(
          `[Block Monitor Producer - ${
            this.source
          }] Skip attempt to process block: ${
            this.nextBlock
          } which exceeds current confirmed block: ${
            currentBlock - blockDelay
          }`,
        );
        return;
      }

      const endBlock = Number(this.configService.get('default_end_block'));

      if ((this.source === 'MONITOR' && this.nextBlock < endBlock) ||
        (this.source === "ARCHIVE" && this.nextBlock > endBlock)) {
        this.logger.log(
          `[Block Monitor Producer - ${
            this.source
          }] Skip attempt to process block: ${
            this.nextBlock
          } which exceeds the end block: ${endBlock}`,
        );
        return;
      }

      // Prepare queue messages
      const message: Message<QueueMessageBody> = {
        id: this.nextBlock.toString(),
        body: {
          blockNum: this.nextBlock,
        },
        groupId: this.nextBlock.toString(),
        deduplicationId: this.nextBlock.toString(),
      };
      await this.sendMessage(message);
      this.logger.log(
        `[Block Monitor Producer - ${this.source}] Successfully sent block num: ${this.nextBlock}`,
      );

      // Increase the record
      await this.nftBlockMonitorService.updateLatestOne(
        this.nextBlock,
        this.source,
      );
    }
  }

  /**
   * #1. check if there is any task need to be retry
   * #2. send to queue
   * #3. delete
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  public async checkBlockRetryTask() {
    // get retry task
    const retryBlock = await this.nftBlockMonitorService.getRetryBlock(
      this.source,
    );
    if (!retryBlock) {
      return;
    }
    this.logger.log(
      `[${this.source} Retry] Find one retry task: ${retryBlock.blockNum}`,
    );

    // Prepare queue messages
    const message: Message<QueueMessageBody> = {
      id: retryBlock.blockNum.toString(),
      body: {
        blockNum: retryBlock.blockNum,
      },
      groupId: retryBlock.blockNum.toString(),
      deduplicationId: retryBlock.blockNum.toString(),
    };
    await this.sendMessage(message);
    this.logger.log(
      `[${this.source} Retry] Successfully sent block num: ${retryBlock.blockNum}`,
    );

    // delete this retry task
    await this.nftBlockMonitorService.deleteOne(retryBlock.messageId);
  }

  async sendMessage<T = any>(payload: Message<T> | Message<T>[]) {
    const originalMessages = Array.isArray(payload) ? payload : [payload];
    const messages = originalMessages.map((message) => {
      let body = message.body;
      if (typeof body !== 'string') {
        body = JSON.stringify(body) as any;
      }

      return {
        ...message,
        body,
      };
    });

    return await this.sqsProducer.send(messages as any[]);
  }
}
