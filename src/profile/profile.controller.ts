import { Body, ClassSerializerInterceptor, Controller, Patch, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import ReqWithUser from 'src/auth/interface/req-with-user.interface';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

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
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFiles() files: { avatar?: Express.Multer.File[]; background?: Express.Multer.File[] }
  ) {
    return this.profileService.updateProfile(req.user, updateProfileDto, files.avatar?.[0], files.background?.[0]);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  updatePassword(@Request() req: ReqWithUser, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.profileService.updatePassword(req.user, updatePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('email')
  updateEmail(@Request() req: ReqWithUser, @Body() updateEmailDto: UpdateEmailDto) {
    return this.profileService.updateEmail(req.user, updateEmailDto);
  }
}
