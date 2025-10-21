import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  correo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  contraseña?: string;

  @ApiPropertyOptional({ description: 'Alias sin tilde de contraseña' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena?: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ enum: ['admin', 'doctor', 'asistente'] })
  @IsEnum(['admin', 'doctor', 'asistente'] as const)
  rol!: 'admin' | 'doctor' | 'asistente';
}
