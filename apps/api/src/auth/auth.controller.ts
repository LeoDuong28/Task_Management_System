import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponse, ApiResponse } from '@libs/data';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
      message: 'Registration successful',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
      message: 'Login successful',
    };
  }
}
