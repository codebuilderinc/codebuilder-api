
import {Tag} from './tag.entity'


export class Taggable {
  id: number ;
tagId: number ;
tagType: string ;
taggableId: number ;
tag?: Tag ;
createdAt: Date ;
}
