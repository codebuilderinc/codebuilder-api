import { Injectable, Logger } from '@nestjs/common';
import { JobService } from './job.service';

@Injectable()
export class Web3CareerService {
  private readonly logger = new Logger(Web3CareerService.name);

  constructor(private readonly jobService: JobService) {}

  private get web3CareerApiUrl(): string {
    const token = process.env.WEB3CAREER_API_TOKEN || 'Rg9PrsGP96Z2GB6T9tNZ1AzHzriQEwxa';
    return `https://web3.career/api/v1?token=${token}`;
  }

  async fetchWeb3CareerJobs() {
    try {
      const response = await fetch(this.web3CareerApiUrl);
      if (!response.ok) throw new Error(`Web3Career API request failed with status: ${response.status}`);
      const data = await response.json();
      const jobsArray = Array.isArray(data[2]) ? data[2] : [];
      this.logger.log(`Web3Career jobs fetched: ${jobsArray.length}`);
      return jobsArray;
    } catch (error: any) {
      this.logger.error(`Error fetching Web3Career jobs: ${error.message}`);
      throw error;
    }
  }

  async storeWeb3CareerJobs(jobs: any[]) {
    const newJobs = [];
    for (const job of jobs) {
      try {
        const jobInput = {
          title: job.title,
          company: job.company,
          author: '',
          location: job.location,
          url: job.apply_url,
          postedAt: job.date,
          description: job.description,
          isRemote: !!job.is_remote,
          tags: Array.isArray(job.tags) ? job.tags : [],
          metadata: {
            country: job.country || '',
            city: job.city || '',
            date_epoch: job.date_epoch ? String(job.date_epoch) : '',
          },
          source: {
            name: 'web3career',
            externalId: job.id ? String(job.id) : undefined,
            rawUrl: job.apply_url,
            data: job,
          },
        };
        // EARLY STOP: if job already exists assume remaining are older.
        const exists = await this.jobService.jobExists(job.apply_url);
        if (exists) {
          this.logger.log(`Encountered existing Web3Career job ${job.apply_url}; stopping further processing.`);
          break;
        }
        const upserted = await this.jobService.upsertJob(jobInput);
        newJobs.push(upserted);
      } catch (error: any) {
        this.logger.error(`Error storing Web3Career job: ${error.message}`);
      }
    }
    return newJobs;
  }

  async fetchAndStoreWeb3CareerJobs() {
    const jobs = await this.fetchWeb3CareerJobs();
    await this.storeWeb3CareerJobs(jobs);
  }
}
