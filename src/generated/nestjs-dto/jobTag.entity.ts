
import {Job} from './job.entity'
import {Tag} from './tag.entity'


export class JobTag {
  id: number ;
jobId: number ;
tagId: number ;
job?: Job ;
tag?: Tag ;
}
