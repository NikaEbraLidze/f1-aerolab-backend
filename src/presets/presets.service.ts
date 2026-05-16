import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresetDto } from './dto/create-preset.dto';

@Injectable()
export class PresetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.preset.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.preset.findUnique({ where: { id } });
  }

  create(dto: CreatePresetDto) {
    return this.prisma.preset.create({ data: dto });
  }

  remove(id: string) {
    return this.prisma.preset.delete({ where: { id } });
  }
}
