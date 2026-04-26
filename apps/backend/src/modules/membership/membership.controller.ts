import { Controller, Get, Headers } from '@nestjs/common';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('plans')
  getPlans() {
    return this.membershipService.getPlans();
  }

  @Get('current')
  getCurrentMembership(@Headers('x-device-id') deviceId: string) {
    return this.membershipService.getCurrentMembership(deviceId);
  }

  @Get('benefits')
  getBenefits() {
    return this.membershipService.getBenefits();
  }
}
