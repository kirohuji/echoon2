import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth } from './auth';

@Controller('auth')
export class AuthController {
  @Get('ok')
  getOk() {
    return { status: 'ok' };
  }

  @Get('session')
  async getSession(@Req() req: Request) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException('未登录');
    }

    return session;
  }
}
