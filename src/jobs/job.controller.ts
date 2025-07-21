import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobOrderByDto } from './dto/job-order-by.dto';
import { RedisAuthGuard } from '../common/auth/redis-auth.guard';
import { UserEntity as User } from '../common/decorators/user.decorator';
import { ApiPaginationQuery } from './../common/decorators/api-nested-query.decorator';
import { PaginationArgs } from '../common/pagination/pagination.args';

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
    constructor(private readonly jobService: JobService) {}

    /**
     * Create a new job listing
     * Creates a new job entry in the database with the provided information
     */
    @Post()
    @UseGuards(RedisAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create a new job listing',
        description: 'Creates a new job listing with title, description, company info, and other details',
    })
    @ApiResponse({
        status: 201,
        description: 'Job successfully created',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid job data provided',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
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
    @ApiOperation({
        summary: 'Get all job listings',
        description: 'Retrieves a paginated list of job listings with optional filtering',
    })
    @ApiPaginationQuery()
    @ApiQuery({ name: 'search', required: false, description: 'Search in job title and description' })
    @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
    @ApiQuery({ name: 'location', required: false, description: 'Filter by location' })
    @ApiQuery({ name: 'isRemote', required: false, description: 'Filter by remote status', type: Boolean })
    @ApiQuery({ name: 'tags', required: false, description: 'Filter by tag names (comma-separated)' })
    @ApiResponse({
        status: 200,
        description: 'List of job listings retrieved successfully',
    })
    async findAll(
        @Query() paginationArgs: PaginationArgs,
        @Query() orderBy: JobOrderByDto,
        @Query('search') search?: string,
        @Query('companyId', new ParseIntPipe({ optional: true })) companyId?: number,
        @Query('location') location?: string,
        @Query('isRemote') isRemote?: boolean,
        @Query('tags') tags?: string
    ) {
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
    @ApiOperation({
        summary: 'Get job by ID',
        description: 'Retrieves a specific job listing with all related data',
    })
    @ApiParam({ name: 'id', description: 'Job ID', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Job details retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Job not found',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.jobService.findOne(id);
    }

    /**
     * Update an existing job listing
     * Updates job information - requires authentication
     */
    @Put(':id')
    @UseGuards(RedisAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update job listing',
        description: 'Updates an existing job listing with new information',
    })
    @ApiParam({ name: 'id', description: 'Job ID', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Job updated successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Job not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
    })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateJobDto: UpdateJobDto, @User() user: any) {
        return this.jobService.update(id, updateJobDto, user.id);
    }

    /**
     * Delete a job listing
     * Removes a job listing from the database - requires authentication
     */
    @Delete(':id')
    @UseGuards(RedisAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Delete job listing',
        description: 'Removes a job listing from the database',
    })
    @ApiParam({ name: 'id', description: 'Job ID', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Job deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Job not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - authentication required',
    })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number, @User() user: any) {
        return this.jobService.remove(id, user.id);
    }

    /**
     * Get jobs by company
     * Retrieves all job listings for a specific company
     */
    @Get('company/:companyId')
    @ApiOperation({
        summary: 'Get jobs by company',
        description: 'Retrieves all job listings for a specific company',
    })
    @ApiParam({ name: 'companyId', description: 'Company ID', type: Number })
    @ApiPaginationQuery()
    @ApiResponse({
        status: 200,
        description: 'Company jobs retrieved successfully',
    })
    async findByCompany(@Param('companyId', ParseIntPipe) companyId: number, @Query() paginationArgs: PaginationArgs, @Query() orderBy: JobOrderByDto) {
        return this.jobService.findByCompany(companyId, paginationArgs, orderBy);
    }

    /**
     * Get jobs by tag
     * Retrieves all job listings that have a specific tag
     */
    @Get('tag/:tagName')
    @ApiOperation({
        summary: 'Get jobs by tag',
        description: 'Retrieves all job listings that have a specific tag',
    })
    @ApiParam({ name: 'tagName', description: 'Tag name', type: String })
    @ApiPaginationQuery()
    @ApiResponse({
        status: 200,
        description: 'Tagged jobs retrieved successfully',
    })
    async findByTag(@Param('tagName') tagName: string, @Query() paginationArgs: PaginationArgs, @Query() orderBy: JobOrderByDto) {
        return this.jobService.findByTag(tagName, paginationArgs, orderBy);
    }
}
