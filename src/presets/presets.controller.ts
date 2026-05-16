import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PresetsService } from './presets.service';
import { CreatePresetDto } from './dto/create-preset.dto';

@ApiTags('presets')
@Controller('presets')
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all saved presets' })
  findAll() {
    return this.presetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a preset by ID' })
  findOne(@Param('id') id: string) {
    return this.presetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new preset' })
  create(@Body() dto: CreatePresetDto) {
    return this.presetsService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a preset by ID' })
  remove(@Param('id') id: string) {
    return this.presetsService.remove(id);
  }
}
