
import {Prisma} from '@prisma/client'




export class UpdateErrorReportDto {
  message?: string;
stack?: string;
platform?: string;
isFatal?: boolean;
errorInfo?: Prisma.InputJsonValue;
payload?: Prisma.InputJsonValue;
}
