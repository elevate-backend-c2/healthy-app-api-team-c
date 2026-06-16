import { Module } from '@nestjs/common';
import { ConfigurationService } from './config.service';
import { ConfigurationController } from './config.controller';

@Module({
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
})
export class ConfigurationModule {}
