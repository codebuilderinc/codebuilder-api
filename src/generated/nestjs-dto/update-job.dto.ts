
import {Prisma} from '@prisma/client'




export class UpdateJobDto {
  title?: string;
author?: string;
location?: string;
url?: string;
postedAt?: Date;
description?: string;
isRemote?: boolean;
source?: string;
externalId?: string;
data?: Prisma.InputJsonValue;
}
