import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { PermissionsService } from '../permissions/permissions.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly perms: PermissionsService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async myPermissions(@Req() req: any) {
    const role = req.user?.rol as string | undefined;
    if (!role) return [];
    const list = await this.perms.listRolePermissions(role);
    return list.map((rp: any) => rp.permission?.key || rp.key).filter(Boolean);
  }
}
