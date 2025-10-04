import { Prisma } from '@prisma/client';

export class JobSource {
  id: number;
  jobId: number;
  source: string;
  externalId: string | null;
  rawUrl: string | null;
  data: Prisma.JsonValue | null;
  createdAt: Date;
}
