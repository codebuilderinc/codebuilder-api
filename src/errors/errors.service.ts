import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateErrorReportDto } from './dto/create-error-report.dto';

@Injectable()
export class ErrorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateErrorReportDto) {
    const { message, stack, platform, options } = dto;
    const { isFatal, errorInfo } = options || {};

    const report = await this.prisma.errorReport.create({
      data: {
        message,
        stack,
        platform,
        isFatal,
        errorInfo: errorInfo ?? null,
        payload: dto as any, // store full original payload
      },
    });
    return report;
  }
}
