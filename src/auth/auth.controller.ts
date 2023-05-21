import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register.dto';
import JwtAuthGuard from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ReqWithUser } from './interface/auth.interface';
import { RegisterDeviceRequestDto } from './dto/register-device.dto';
import { GoogleAuthenticateRequestDto } from './dto/google-authenticate.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerRequestDto: RegisterRequestDto) {
    return this.authService.register(registerRequestDto);
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() request: ReqWithUser) {
    const user = request.user;
    const token = this.authService.getCookieWithJwtToken(user.id);
    return {
      token,
      user
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() request: ReqWithUser) {
    return request.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('register_device')
  registerDevice(@Req() request: ReqWithUser, @Body() registerDeviceRequestDto: RegisterDeviceRequestDto) {
    return this.authService.registerDevice(request.user, registerDeviceRequestDto);
  }

  @Post('google-authenticate')
  googleAuthenticate(@Body() googleAuthenticateRequestDto: GoogleAuthenticateRequestDto) {
    return this.authService.authenticateWithGoogle(googleAuthenticateRequestDto);
  }
}
