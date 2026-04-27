import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigGuideService } from './config-guide.service';
import { BindConfigDto } from './dto/bind-config.dto';
import { getOptionalAuthSession } from '../auth/session.util';

@Controller()
export class ConfigGuideController {
  constructor(private readonly configGuideService: ConfigGuideService) {}

  @Get('config/options')
  getOptions() {
    return this.configGuideService.getOptions();
  }

  @Post('config/bind')
  async bindConfig(
    @Req() req: Request,
    @Headers('x-device-id') deviceId: string,
    @Body() dto: BindConfigDto,
  ) {
    const session = await getOptionalAuthSession(req);
    return this.configGuideService.bindConfig(
      { deviceId, userId: session?.user?.id },
      dto,
    );
  }

  @Get('config/current')
  async getCurrentConfig(
    @Req() req: Request,
    @Headers('x-device-id') deviceId: string,
  ) {
    const session = await getOptionalAuthSession(req);
    return this.configGuideService.getCurrentConfig({
      deviceId,
      userId: session?.user?.id,
    });
  }

  @Get('bootstrap')
  async getBootstrap(@Req() req: Request, @Headers('x-device-id') deviceId: string) {
    const session = await getOptionalAuthSession(req);
    return this.configGuideService.getBootstrap({
      deviceId,
      userId: session?.user?.id,
    });
  }
}
