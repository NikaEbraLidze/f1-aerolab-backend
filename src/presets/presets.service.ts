import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresetDto } from './dto/create-preset.dto';

@Injectable()
export class PresetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.preset.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const preset = await this.prisma.preset.findUnique({ where: { id } });
    if (!preset) {
      throw new NotFoundException(`Preset with id '${id}' not found`);
    }
    return preset;
  }

  create(dto: CreatePresetDto) {
    return this.prisma.preset.create({ data: dto });
  }

  async remove(id: string) {
    try {
      return await this.prisma.preset.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Preset with id '${id}' not found`);
      }
      throw error;
    }
  }
}
