import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateCosPolicyDto } from './dto/create-cos-policy.dto';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { DeleteReferenceDto } from './dto/delete-reference.dto';
import { FileAssetsService } from './file-assets.service';
import { SetCurrentAvatarDto } from './dto/set-current-avatar.dto';

@Controller('file-assets')
export class FileAssetsController {
  constructor(private readonly fileAssetsService: FileAssetsService) {}

  @Post('cos-policy')
  createCosPolicy(@Body() dto: CreateCosPolicyDto) {
    return this.fileAssetsService.createCosPolicy(dto);
  }

  @Post('complete')
  completeUpload(@Body() dto: CompleteUploadDto) {
    return this.fileAssetsService.completeUpload(dto);
  }

  @Post('references')
  createReference(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: CreateReferenceDto,
  ) {
    return this.fileAssetsService.createReference(deviceId || 'anonymous', dto);
  }

  @Delete('references')
  deleteReference(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: DeleteReferenceDto,
  ) {
    return this.fileAssetsService.deleteReference(deviceId || 'anonymous', dto);
  }

  @Get('avatar/current')
  getCurrentAvatar(@Headers('x-device-id') deviceId: string) {
    return this.fileAssetsService.getCurrentAvatar(deviceId || 'anonymous');
  }

  @Post('avatar/current')
  setCurrentAvatar(
    @Headers('x-device-id') deviceId: string,
    @Body() dto: SetCurrentAvatarDto,
  ) {
    return this.fileAssetsService.setCurrentAvatar(deviceId || 'anonymous', dto);
  }

  @Get(':id/private-url')
  getPrivateUrl(@Param('id') id: string) {
    return this.fileAssetsService.getPrivateUrlByAssetId(id);
  }

  @Get(':id/references')
  listReferences(@Param('id') id: string) {
    return this.fileAssetsService.listReferences(id);
  }
}
