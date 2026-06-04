import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'User has been successfully registered. Please check your email for verification.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
