
import {Prisma,SubscriptionType} from '@prisma/client'
import {Location} from './location.entity'


export class Subscription {
  id: number ;
ipAddress: string ;
type: SubscriptionType ;
endpoint: string ;
keys: Prisma.JsonValue  | null;
createdAt: Date ;
locations?: Location[] ;
}
