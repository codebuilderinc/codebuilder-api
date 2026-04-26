
import {JobTag} from './jobTag.entity'
import {Taggable} from './taggable.entity'


export class Tag {
  id: number ;
name: string ;
jobTags?: JobTag[] ;
taggables?: Taggable[] ;
}
