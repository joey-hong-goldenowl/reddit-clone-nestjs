import { Body, ClassSerializerInterceptor, Controller, Patch, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import ReqWithUser from 'src/auth/interface/req-with-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}
  @UseGuards(JwtAuthGuard)
  @Patch('')
  updateProfile(@Request() req: ReqWithUser, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user, updateProfileDto);
  }
}
