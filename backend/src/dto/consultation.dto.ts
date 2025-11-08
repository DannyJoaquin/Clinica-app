import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({ description: 'ID de la cita (appointment)', example: 1 })
  @IsInt()
  appointmentId!: number;

  @ApiProperty({ description: 'Diagnóstico' })
  @IsString()
  @MinLength(2)
  diagnosis!: string;

  @ApiProperty({ description: 'Tratamiento' })
  @IsString()
  @MinLength(2)
  treatment!: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
