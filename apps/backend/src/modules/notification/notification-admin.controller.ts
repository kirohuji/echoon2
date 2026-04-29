import { Controller, Post, Get, Body, Query, Req, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { requireAuthSession } from '../auth/session.util';

@Controller('admin/notifications')
export class NotificationAdminController {
  constructor(private readonly notificationService: NotificationService) {}

  private async requireAdmin(req: Request) {
    const session = await requireAuthSession(req);
    if ((session.user as any)?.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限');
    }
    return session;
  }

  @Get()
  async list(@Req() req: Request, @Query() pagination: PaginationDto) {
    await this.requireAdmin(req);
    return this.notificationService.listAllNotifications(pagination);
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateNotificationDto) {
    const session = await this.requireAdmin(req);
    return this.notificationService.createNotification(session.user.id, dto);
  }

  @Get('search-users')
  async searchUsers(@Req() req: Request, @Query('keyword') keyword: string) {
    await this.requireAdmin(req);
    return this.notificationService.searchUsers(keyword || '');
  }
}
