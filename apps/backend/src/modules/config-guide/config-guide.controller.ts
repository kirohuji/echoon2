import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ConfigGuideService } from './config-guide.service';
import { BindConfigDto } from './dto/bind-config.dto';

@Controller()
export class ConfigGuideController {
  constructor(private readonly configGuideService: ConfigGuideService) {}

  @Get('config/options')
  getOptions() {
    return this.configGuideService.getOptions();
  }

  @Post('config/bind')
  bindConfig(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: BindConfigDto,
  ) {
    return this.configGuideService.bindConfig(deviceId, dto);
  }

  @Get('config/current')
  getCurrentConfig(@Headers('x-device-id') deviceId: string) {
    return this.configGuideService.getCurrentConfig(deviceId);
  }

  @Get('bootstrap')
  getBootstrap(@Headers('x-device-id') deviceId: string) {
    return this.configGuideService.getBootstrap(deviceId);
  }
}
