import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('overview')
  getOverview(@Headers('x-device-id') deviceId: string) {
    return this.profileService.getOverview(deviceId);
  }

  @Get('activity-heatmap')
  getActivityHeatmap(@Headers('x-device-id') deviceId: string) {
    return this.profileService.getActivityHeatmap(deviceId);
  }

  @Get('practice-records')
  getPracticeRecords(
    @Headers('x-device-id') deviceId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.profileService.getPracticeRecords(deviceId, pagination);
  }
}
