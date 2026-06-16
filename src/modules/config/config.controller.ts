import { Controller, Get, Header, Post } from '@nestjs/common';
import { ConfigurationService } from './config.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/is-public';

@Controller('config')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Public()
  @Post('welcome')
  @ApiOperation({ summary: 'Get welcome configuration' })
  @ApiResponse({
    status: 200,
    description: 'Welcome configuration retrieved successfully.',
  })
  @Get('welcome')
  @Header('Cache-Control', 'public, max-age=3600')
  async getWelcomeConfig() {
    return await this.configurationService.getWelcomeConfig();
  }
}
