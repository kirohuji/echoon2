import { Controller, Get, Patch, Param, Body, Query, Req, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { requireAuthSession } from '../auth/session.util';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private async requireAdmin(req: Request) {
    const session = await requireAuthSession(req);

    if ((session.user as any)?.role !== 'admin') {
      throw new ForbiddenException('需要管理员权限');
    }

    return session;
  }

  @Get('users')
  async listUsers(@Req() req: Request, @Query() pagination: PaginationDto) {
    await this.requireAdmin(req);
    return this.adminService.listUsers(pagination);
  }

  @Get('users/:id')
  async getUserDetail(@Req() req: Request, @Param('id') id: string) {
    await this.requireAdmin(req);
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const session = await this.requireAdmin(req);
    return this.adminService.updateUserRole(id, dto, session.user.id);
  }
}
