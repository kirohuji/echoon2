import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { MockExamService } from './mock-exam.service';
import { StartExamDto, SubmitExamDto } from './dto/submit-exam.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('mock')
export class MockExamController {
  constructor(private readonly mockExamService: MockExamService) {}

  @Get('papers')
  getPapers(@Headers('x-device-id') deviceId: string) {
    return this.mockExamService.getPapers(deviceId);
  }

  @Get('recent-scores')
  getRecentScores(
    @Headers('x-device-id') deviceId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.mockExamService.getRecentScores(deviceId, pagination);
  }

  @Get('scores')
  getScores(
    @Headers('x-device-id') deviceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.mockExamService.getScores(deviceId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('dashboard')
  getDashboard(@Headers('x-device-id') deviceId: string) {
    return this.mockExamService.getDashboard(deviceId);
  }

  @Post('start')
  startExam(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: StartExamDto,
  ) {
    return this.mockExamService.startExam(deviceId, dto);
  }

  @Post('submit')
  submitExam(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.mockExamService.submitExam(deviceId, dto);
  }
}
