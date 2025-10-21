import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePagoDto {
  @ApiProperty()
  @IsInt()
  pacienteId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  citaId?: number;

  @ApiProperty()
  @IsNumber()
  monto!: number;

  @ApiProperty()
  @IsString()
  metodoPago!: string;
}
