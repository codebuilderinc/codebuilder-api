
import {Prisma} from '@prisma/client'




export class UpdateSubscriptionDto {
  ipAddress?: string;
endpoint?: string;
keys?: Prisma.InputJsonValue;
}
