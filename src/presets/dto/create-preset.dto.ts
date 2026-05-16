import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { SimulateParamsDto } from '../../aero/dto/simulate-params.dto';

class PresetNameDto {
  @ApiProperty({ description: 'Name for this car setup preset' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreatePresetDto extends IntersectionType(
  PresetNameDto,
  SimulateParamsDto,
) {}
