
import {Job} from './job.entity'


export class JobMetadata {
  id: number ;
jobId: number ;
name: string ;
value: string ;
createdAt: Date ;
updatedAt: Date ;
job?: Job ;
}
