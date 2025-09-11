import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { ErrorsService } from './errors.service';

@ApiTags('errors')
@Controller('errors')
export class ErrorsController {
  constructor(private readonly errorsService: ErrorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Api({
    summary: 'Log a client error',
    description: 'Stores an error report mirroring the frontend /api/errors endpoint.',
    bodyType: CreateErrorReportDto,
    responses: [
      { status: 201, description: 'Error logged successfully.' },
      { status: 400, description: 'Invalid error report payload.' },
    ],
    envelope: true,
  })
  async create(@Body() dto: CreateErrorReportDto) {
    const report = await this.errorsService.create(dto);
    return { message: 'Error logged successfully.', reportId: report.id };
  }
}
