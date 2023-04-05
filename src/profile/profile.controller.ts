import { Body, ClassSerializerInterceptor, Controller, Get, Patch, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { CommunityService } from 'src/community/community.service';
import { UpdateEmailRequestDto } from './dto/update-email.dto';
import { UpdatePasswordRequestDto } from './dto/update-password.dto';
import { UpdateProfileRequestDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService, private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'background', maxCount: 1 }
    ])
  )
  @Patch('')
  updateProfile(
    @Request() req: ReqWithUser,
    @Body() updateProfileRequestDto: UpdateProfileRequestDto,
    @UploadedFiles() files: { avatar?: Express.Multer.File[]; background?: Express.Multer.File[] }
  ) {
    return this.profileService.updateProfile(req.user, updateProfileRequestDto, files.avatar?.[0], files.background?.[0]);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  updatePassword(@Request() req: ReqWithUser, @Body() updatePasswordRequestDto: UpdatePasswordRequestDto) {
    return this.profileService.updatePassword(req.user, updatePasswordRequestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('email')
  updateEmail(@Request() req: ReqWithUser, @Body() updateEmailRequestDto: UpdateEmailRequestDto) {
    return this.profileService.updateEmail(req.user, updateEmailRequestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('community')
  getOwnedCommunities(@Request() req: ReqWithUser) {
    return this.communityService.findAllOwned(req.user.id);
  }
}
