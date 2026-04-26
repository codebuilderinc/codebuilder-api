
import {Prisma} from '@prisma/client'




export class CreateErrorReportDto {
  message: string;
stack?: string;
platform?: string;
isFatal?: boolean;
errorInfo?: Prisma.InputJsonValue;
payload: Prisma.InputJsonValue;
}
