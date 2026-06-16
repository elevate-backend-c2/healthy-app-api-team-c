import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';
import { Public } from '../../common/decorators/is-public';
import { JwtRefreshGuard } from '../../common/guards/jwt.auth.refresh.guard';
import { RefreshUser } from '../../common/types/request.type';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
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
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'logout user' })
  @ApiResponse({
    status: 200,
    description: 'User logout in successfully',
  })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token!);
  }

  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req: Request & { user: RefreshUser }) {
    return this.authService.refresh(req.user);
  }
}
