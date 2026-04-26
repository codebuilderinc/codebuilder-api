
import {Prisma} from '@prisma/client'




export class CreateJobDto {
  title: string;
author?: string;
location?: string;
url: string;
postedAt?: Date;
description?: string;
isRemote?: boolean;
source?: string;
externalId?: string;
data?: Prisma.InputJsonValue;
}
