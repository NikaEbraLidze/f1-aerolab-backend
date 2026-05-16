import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class SimulateParamsDto {
  @ApiProperty({ description: 'Car speed in km/h', minimum: 0, maximum: 400 })
  @IsNumber()
  @Min(0)
  @Max(400)
  speed: number;

  @ApiProperty({
    description: 'Front wing angle in degrees',
    minimum: 0,
    maximum: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  wingAngle: number;

  @ApiProperty({ description: 'Car weight in kg', minimum: 600, maximum: 1000 })
  @IsNumber()
  @Min(0)
  @Max(400)
  weight: number;

  @ApiProperty({ description: 'Car speed in km/h', minimum: 0, maximum: 400 })
  @IsNumber()
  @Min(0)
  @Max(400)
  dragCoefficient: number;
}
