import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationService } from './location.service';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Api({
    summary: 'Create a location data point',
    description:
      'Stores a new location record linked to a push subscription identified by the provided subscription token.',
    bodyType: CreateLocationDto,
    responses: [
      { status: 201, description: 'Location added successfully.' },
      { status: 404, description: 'Subscription not found.' },
      { status: 400, description: 'Invalid location data.' },
    ],
    envelope: true,
  })
  async create(@Body() dto: CreateLocationDto, @Ip() ip: string, @Headers('x-forwarded-for') forwardedFor?: string) {
    // Determine client IP similar to frontend implementation
    let clientIp = 'Unknown';
    if (forwardedFor) {
      clientIp = forwardedFor.split(',')[0].trim();
    } else if (ip) {
      clientIp = ip;
    }

    const location = await this.locationService.createFromSubscriptionToken(dto, clientIp);
    return { message: 'Location added successfully.', location };
  }
}
