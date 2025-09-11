import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobOrderByDto } from './dto/job-order-by.dto';
import { CompanyPathParamsDto, TagPathParamsDto, JobIdPathParamsDto } from './dto/job-path-params.dto';
import { JobFilterQueryDto } from './dto/job-filter-query.dto';
import { RedisAuthGuard } from '../auth/redis-auth.guard';
import { UserEntity as User } from '../common/decorators/user.decorator';
import { ApiPaginationQuery } from './../common/decorators/api-nested-query.decorator';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { Web3CareerService } from './web3career.service';
import { RedditService } from './reddit.service';
import { NotificationsService } from './notifications.service';
import { PaginatedResponse } from '../common/models/paginated-response';
import { CreateJobDto as JobDto } from './dto/create-job.dto';

class PaginatedJobResponse extends PaginatedResponse(JobDto) {}

/**
 * Job Controller
 *
 * Handles HTTP requests for job management operations including:
 * - Creating new job listings
 * - Retrieving job listings (with pagination and filtering)
 * - Updating existing job listings
 * - Deleting job listings
 * - Managing job tags and metadata
 */
@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly web3CareerService: Web3CareerService,
    private readonly redditService: RedditService,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Fetch new jobs from Reddit and Web3Career, store them, and send notifications
   */
  @Get('fetch')
  @Api({
    summary: 'Fetch new jobs from Reddit and Web3Career',
    description: 'Fetches new jobs from both sources, stores them, and sends notifications.',
    responses: [{ status: 200, description: 'Jobs fetched and notifications sent.' }],
  })
  async fetchJobs(): Promise<{ redditJobs: any[]; web3CareerJobs: any[] }> {
    // Fetch Reddit jobs
    const redditSubreddits = [
      'remotejs',
      'remotejobs',
      'forhire',
      'jobs',
      'webdevjobs',
      'frontend',
      'javascript',
      'reactjs',
      'node',
      'typescript',
    ];
    const redditPosts = await this.redditService.fetchRedditPosts(redditSubreddits);
    const redditJobs = await this.redditService.storeRedditJobPosts(redditPosts);

    // Fetch Web3Career jobs
    const web3CareerRawJobs = await this.web3CareerService.fetchWeb3CareerJobs();
    const web3CareerJobs = await this.web3CareerService.storeWeb3CareerJobs(web3CareerRawJobs);

    return { redditJobs, web3CareerJobs };
  }

  /**
   * Get jobs by company
   * Retrieves all job listings for a specific company
   */
  @Get('company/:companyId')
  @Api({
    summary: 'Get jobs by company',
    description: 'Retrieves all job listings for a specific company',
    pathParamsFrom: CompanyPathParamsDto,
  paginatedResponseType: JobDto,
  envelope: true,
    queriesFrom: [PaginationArgs],
  })
  async findByCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() paginationArgs: PaginationArgs,
    @Query() orderBy: JobOrderByDto,
    @Query('skip') skipParam?: string,
    @Query('first') firstParam?: string
  ) {
    // Ensure pagination parameters are properly converted to numbers
    if (skipParam) {
      paginationArgs.skip = parseInt(skipParam, 10);
    }
    if (firstParam) {
      paginationArgs.first = parseInt(firstParam, 10);
    }

    return this.jobService.findByCompany(companyId, paginationArgs, orderBy);
  }

  /**
   * Get jobs by tag
   * Retrieves all job listings that have a specific tag
   */
  @Get('tag/:tagName')
  @Api({
    summary: 'Get jobs by tag',
    description: 'Retrieves all job listings that have a specific tag',
    pathParamsFrom: TagPathParamsDto,
  paginatedResponseType: JobDto,
  envelope: true,
    queriesFrom: [PaginationArgs],
  })
  async findByTag(
    @Param('tagName') tagName: string,
    @Query() paginationArgs: PaginationArgs,
    @Query() orderBy: JobOrderByDto,
    @Query('skip') skipParam?: string,
    @Query('first') firstParam?: string
  ) {
    // Ensure pagination parameters are properly converted to numbers
    if (skipParam) {
      paginationArgs.skip = parseInt(skipParam, 10);
    }
    if (firstParam) {
      paginationArgs.first = parseInt(firstParam, 10);
    }

    return this.jobService.findByTag(tagName, paginationArgs, orderBy);
  }

  /**
   * Create a new job listing
   * Creates a new job entry in the database with the provided information
   */
  @Post()
  @Api({
    summary: 'Create a new job listing',
    description: 'Creates a new job listing with title, description, company info, and other details',
    bodyType: CreateJobDto,
    authenticationRequired: true,
    responses: [
      { status: 201, description: 'Job successfully created' },
      { status: 400, description: 'Invalid job data provided' },
      { status: 401, description: 'Unauthorized - authentication required' },
    ],
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createJobDto: CreateJobDto, @User() user: any) {
    return this.jobService.create(createJobDto, user.id);
  }

  /**
   * Get all job listings with optional filtering and pagination
   * Supports filtering by company, location, remote status, and tags
   */
  @Get()
  @Api({
    summary: 'Get all job listings',
    description: 'Retrieves a paginated list of job listings with optional filtering',
  paginatedResponseType: JobDto,
  envelope: true,
    queriesFrom: [PaginationArgs, JobFilterQueryDto],
  })
  async findAll(
    @Query() paginationArgs: PaginationArgs,
    @Query() orderBy: JobOrderByDto,
    @Query('search') search?: string,
    @Query('companyId', new ParseIntPipe({ optional: true })) companyId?: number,
    @Query('location') location?: string,
    @Query('isRemote') isRemote?: boolean,
    @Query('tags') tags?: string,
    @Query('skip') skipParam?: string,
    @Query('first') firstParam?: string
  ) {
    // Ensure pagination parameters are properly converted to numbers
    if (skipParam) {
      paginationArgs.skip = parseInt(skipParam, 10);
    }
    if (firstParam) {
      paginationArgs.first = parseInt(firstParam, 10);
    }

    console.log('Pagination params:', { skip: paginationArgs.skip, first: paginationArgs.first });

    return this.jobService.findAll({
      paginationArgs,
      orderBy,
      search,
      companyId,
      location,
      isRemote,
      tags: tags?.split(','),
    });
  }

  /**
   * Get a specific job listing by ID
   * Returns detailed information about a single job including company, tags, and metadata
   */
  @Get(':id')
  @Api({
    summary: 'Get job by ID',
    description: 'Retrieves a specific job listing with all related data',
    pathParamsFrom: JobIdPathParamsDto,
    responses: [
      { status: 200, description: 'Job details retrieved successfully' },
      { status: 404, description: 'Job not found' },
    ],
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.findOne(id);
  }

  /**
   * Update an existing job listing
   * Updates job information - requires authentication
   */
  @Put(':id')
  @Api({
    summary: 'Update job listing',
    description: 'Updates an existing job listing with new information',
    authenticationRequired: true,
    bodyType: UpdateJobDto,
    pathParamsFrom: JobIdPathParamsDto,
    responses: [
      { status: 200, description: 'Job updated successfully' },
      { status: 404, description: 'Job not found' },
      { status: 401, description: 'Unauthorized - authentication required' },
    ],
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateJobDto: UpdateJobDto, @User() user: any) {
    return this.jobService.update(id, updateJobDto, user.id);
  }

  /**
   * Delete a job listing
   * Removes a job listing from the database - requires authentication
   */
  @Delete(':id')
  @Api({
    summary: 'Delete job listing',
    description: 'Removes a job listing from the database',
    authenticationRequired: true,
    pathParamsFrom: JobIdPathParamsDto,
    responses: [
      { status: 200, description: 'Job deleted successfully' },
      { status: 404, description: 'Job not found' },
      { status: 401, description: 'Unauthorized - authentication required' },
    ],
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
    return this.jobService.remove(id, user.id);
  }
}
