
import {Prisma} from '@prisma/client'


export class ErrorReport {
  id: string ;
message: string ;
stack: string  | null;
platform: string  | null;
isFatal: boolean  | null;
errorInfo: Prisma.JsonValue  | null;
payload: Prisma.JsonValue ;
createdAt: Date ;
}
