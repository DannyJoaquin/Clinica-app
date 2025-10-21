import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty()
  @IsEmail()
  correo!: string;

  @ApiProperty({ enum: ['admin', 'doctor', 'asistente'] })
  @IsEnum(['admin', 'doctor', 'asistente'] as const)
  rol!: 'admin' | 'doctor' | 'asistente';

  @ApiProperty()
  @IsString()
  @MinLength(6)
  contrasena!: string;
}

export class UpdateUsuarioDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ enum: ['admin', 'doctor', 'asistente'] })
  @IsOptional()
  @IsEnum(['admin', 'doctor', 'asistente'] as const)
  rol?: 'admin' | 'doctor' | 'asistente';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena?: string;
}
