import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LineLoginDto } from './dto/line-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('line')
  async login(@Body() lineLoginDto: LineLoginDto) {
    return this.authService.validateLineToken(lineLoginDto.idToken);
  }
}
