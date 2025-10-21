import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePacienteDto {
  @ApiProperty()
  @IsString()
  nombreCompleto!: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  fechaNacimiento!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  antecedentes?: string;
}

export class UpdatePacienteDto extends PartialType(CreatePacienteDto) {}
