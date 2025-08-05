
import {Prisma} from '@prisma/client'




export class UpdateJobSourceDto {
  source?: string;
externalId?: string;
rawUrl?: string;
data?: Prisma.InputJsonValue;
}
