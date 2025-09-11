import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a Location entry by resolving the provided subscription token to a Subscription row.
   * Mirrors the logic in the Next.js /api/location route (token stored in Subscription.keys JSON).
   */
  async createFromSubscriptionToken(dto: CreateLocationDto, ipAddress: string) {
    // Find subscription whose JSON `keys` contains the provided token.
    // Prisma JSON partial match: we need to fetch candidates then filter if driver lacks contains helper in generated types.
    // We'll search for any subscription where keys is not null then filter in memory.
    const candidates = await this.prisma.subscription.findMany({ where: { keys: { not: null } } });
    const subscription = candidates.find((s: any) => s.keys && s.keys.token === dto.subscriptionId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    const newLocation = await this.prisma.location.create({
      data: {
        subscriptionId: subscription.id,
        ipAddress: ipAddress || 'Unknown',
        accuracy: dto.accuracy,
        altitude: dto.altitude,
        altitudeAccuracy: dto.altitudeAccuracy,
        heading: dto.heading,
        latitude: dto.latitude,
        longitude: dto.longitude,
        speed: dto.speed,
        mocked: dto.mocked ?? false,
        timestamp: dto.timestamp ? BigInt(dto.timestamp) : undefined,
        city: dto.city,
        country: dto.country,
        district: dto.district,
        formattedAddress: dto.formattedAddress,
        isoCountryCode: dto.isoCountryCode,
        name: dto.name,
        postalCode: dto.postalCode,
        region: dto.region,
        street: dto.street,
        streetNumber: dto.streetNumber,
        subregion: dto.subregion,
        timezone: dto.timezone,
      },
    });

    return newLocation;
  }
}
