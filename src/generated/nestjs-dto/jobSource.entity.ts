
import {Prisma} from '@prisma/client'
import {Job} from './job.entity'


export class JobSource {
  id: number ;
jobId: number ;
source: string ;
externalId: string  | null;
rawUrl: string  | null;
data: Prisma.JsonValue  | null;
createdAt: Date ;
job?: Job ;
}
