import { Job } from './job.entity';

export class Company {
  id: number;
  name: string;
  jobs?: Job[];
  createdAt: Date;
}
