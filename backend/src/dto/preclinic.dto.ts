import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpsertPreclinicDto {
  @ApiProperty({ description: 'ID de la cita (appointment)' })
  @IsInt()
  appointmentId!: number;

  @ApiProperty({ description: 'Peso en kg', example: 70 })
  @IsNumber()
  @Min(0)
  weight!: number;

  @ApiProperty({ description: 'Altura en cm', example: 170 })
  @IsNumber()
  @Min(0)
  height!: number;

  @ApiProperty({ description: 'Presión arterial', example: '120/80' })
  @IsString()
  @MinLength(2)
  bloodPressure!: string;

  @ApiProperty({ description: 'Temperatura °C', example: 36.7 })
  @IsNumber()
  temperature!: number;

  @ApiProperty({ description: 'Frecuencia cardiaca bpm', example: 72 })
  @IsInt()
  heartRate!: number;

  @ApiProperty({ description: 'Saturación de oxígeno %', example: 98 })
  @IsInt()
  oxygenSat!: number;

  @ApiProperty({ description: 'Motivo de la visita' })
  @IsString()
  @MinLength(2)
  reason!: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWalkinPreclinicDto {
  @ApiProperty({ description: 'ID del paciente' })
  @IsInt()
  patientId!: number;

  @ApiProperty({ description: 'ID del doctor asignado' })
  @IsInt()
  doctorId!: number;

  @ApiProperty({ description: 'Peso en kg', example: 70 })
  @IsNumber()
  @Min(0)
  weight!: number;

  @ApiProperty({ description: 'Altura en cm', example: 170 })
  @IsNumber()
  @Min(0)
  height!: number;

  @ApiProperty({ description: 'Presión arterial', example: '120/80' })
  @IsString()
  @MinLength(2)
  bloodPressure!: string;

  @ApiProperty({ description: 'Temperatura °C', example: 36.7 })
  @IsNumber()
  temperature!: number;

  @ApiProperty({ description: 'Frecuencia cardiaca bpm', example: 72 })
  @IsInt()
  heartRate!: number;

  @ApiProperty({ description: 'Saturación de oxígeno %', example: 98 })
  @IsInt()
  oxygenSat!: number;

  @ApiProperty({ description: 'Motivo de la visita' })
  @IsString()
  @MinLength(2)
  reason!: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
