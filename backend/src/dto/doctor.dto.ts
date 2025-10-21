import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty()
  @IsEmail()
  correo!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  contrasena!: string;
}
