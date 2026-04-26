
import {Prisma} from '@prisma/client'




export class CreateSubscriptionDto {
  ipAddress: string;
endpoint: string;
keys?: Prisma.InputJsonValue;
}
