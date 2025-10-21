import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCitaDto {
  @ApiProperty()
  @IsInt()
  pacienteId!: number;

  @ApiProperty()
  @IsInt()
  doctorId!: number;

  @ApiProperty({ example: '2025-10-18T10:00:00.000Z' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  hora!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateCitaDto extends PartialType(CreateCitaDto) {}
