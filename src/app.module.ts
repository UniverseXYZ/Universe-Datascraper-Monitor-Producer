import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import configuration from './modules/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { EthereumModule } from './modules/ethereum/ethereum.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './modules/database/database.service';
import { SqsProducerModule } from './modules/sqs-producer/sqs-producer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NFTBlockTaskModule } from './modules/nft-block-task/nft-block-task.module';
import { NFTBlockMonitorTaskModule } from './modules/nft-block-monitor-task/nft-block-monitor-task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      ignoreEnvVars: false,
      isGlobal: true,
      load: [configuration],
    }),
    TerminusModule,
    MongooseModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: DatabaseService,
    }),
    HealthModule,
    EthereumModule,
    SqsProducerModule,
    ScheduleModule.forRoot(),
    NFTBlockTaskModule,
    NFTBlockMonitorTaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
