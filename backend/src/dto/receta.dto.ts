import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRecetaDto {
  @ApiProperty()
  @IsInt()
  pacienteId!: number;

  @ApiProperty()
  @IsInt()
  doctorId!: number;

  @ApiProperty()
  @IsString()
  medicamentos!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instrucciones?: string;
}
