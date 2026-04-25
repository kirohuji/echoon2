import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AddWordDto } from './dto/add-word.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('favorites')
  getFavorites(
    @Headers('x-device-id') deviceId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.assetsService.getFavorites(deviceId, pagination);
  }

  @Post('favorites/:questionId')
  addFavorite(
    @Headers('x-device-id') deviceId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.assetsService.addFavorite(deviceId, questionId);
  }

  @Delete('favorites/:questionId')
  removeFavorite(
    @Headers('x-device-id') deviceId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.assetsService.removeFavorite(deviceId, questionId);
  }

  @Get('words')
  getWords(
    @Headers('x-device-id') deviceId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.assetsService.getWords(deviceId, pagination);
  }

  @Post('words')
  addWord(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: AddWordDto,
  ) {
    return this.assetsService.addWord(deviceId, dto);
  }

  @Delete('words/:term')
  removeWord(
    @Headers('x-device-id') deviceId: string,
    @Param('term') term: string,
  ) {
    return this.assetsService.removeWord(deviceId, term);
  }
}
