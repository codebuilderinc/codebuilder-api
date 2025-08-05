
import {Prisma} from '@prisma/client'




export class CreateJobSourceDto {
  source: string;
externalId?: string;
rawUrl?: string;
data?: Prisma.InputJsonValue;
}
