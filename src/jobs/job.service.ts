import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { DatabaseService } from '../common/database/database.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobOrderByDto } from './dto/job-order-by.dto';
import { PaginationArgs } from '../common/pagination/pagination.args';
import { Job, Company, Tag } from '@prisma/client';

/**
 * Job Service
 *
 * Handles business logic for job management including:
 * - CRUD operations for job listings
 * - Job filtering and searching
 * - Company and tag management
 * - Job metadata handling
 * - Source tracking for job provenance
 */
@Injectable()
export class JobService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly prisma: PrismaService
    ) {}

    /**
     * Create a new job listing
     * Creates a job with associated company, tags, and metadata
     */
    async create(createJobDto: CreateJobDto, userId?: number): Promise<Job> {
        const { title, companyName, companyId, author, location, url, description, isRemote, tags, metadata, sources } = createJobDto;

        // Handle company creation or lookup
        let company: Company | null = null;
        if (companyId) {
            company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new BadRequestException('Company not found');
            }
        } else if (companyName) {
            // Find or create company
            company = await this.prisma.company.upsert({
                where: { name: companyName },
                update: {},
                create: { name: companyName },
            });
        }

        // Create the job
        const job = await this.prisma.job.create({
            data: {
                title,
                companyId: company?.id,
                author,
                location,
                url,
                description,
                isRemote,
                postedAt: createJobDto.postedAt || new Date(),
                // Create associated tags
                tags: tags?.length
                    ? {
                          create: tags.map((tagName) => ({
                              tag: {
                                  connectOrCreate: {
                                      where: { name: tagName },
                                      create: { name: tagName },
                                  },
                              },
                          })),
                      }
                    : undefined,
                // Create metadata entries
                metadata: metadata?.length
                    ? {
                          create: metadata.map((meta) => ({
                              name: meta.name,
                              value: meta.value,
                          })),
                      }
                    : undefined,
                // Create source entries
                sources: sources?.length
                    ? {
                          create: sources.map((source) => ({
                              source: source.source,
                              externalId: source.externalId,
                              rawUrl: source.rawUrl,
                              data: source.data,
                          })),
                      }
                    : undefined,
            },
            include: {
                company: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                metadata: true,
                sources: true,
            },
        });

        return job;
    }

    /**
     * Find all jobs with filtering and pagination
     * Supports search, company filtering, location filtering, and tag filtering
     */
    async findAll({
        paginationArgs,
        orderBy,
        search,
        companyId,
        location,
        isRemote,
        tags,
    }: {
        paginationArgs: PaginationArgs;
        orderBy?: JobOrderByDto;
        search?: string;
        companyId?: number;
        location?: string;
        isRemote?: boolean;
        tags?: string[];
    }) {
        const where: any = {};

        // Search filter - searches in title and description
        if (search) {
            where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
        }

        // Company filter
        if (companyId) {
            where.companyId = companyId;
        }

        // Location filter
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }

        // Remote filter
        if (isRemote !== undefined) {
            where.isRemote = isRemote;
        }

        // Tags filter
        if (tags && tags.length > 0) {
            where.tags = {
                some: {
                    tag: {
                        name: { in: tags },
                    },
                },
            };
        }

        // Build order by clause
        const orderByClause = this.buildOrderBy(orderBy);

        // Handle pagination
        const take = paginationArgs.first || 10;
        const skip = paginationArgs.skip || 0;

        // Execute query with pagination
        const [jobs, totalCount] = await Promise.all([
            this.prisma.job.findMany({
                where,
                orderBy: orderByClause,
                skip,
                take,
                include: {
                    company: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    metadata: true,
                    sources: true,
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return {
            jobs,
            totalCount,
            pageInfo: {
                hasNextPage: skip + take < totalCount,
                hasPreviousPage: skip > 0,
                startCursor: skip,
                endCursor: skip + jobs.length,
            },
        };
    }

    /**
     * Find a single job by ID
     * Returns detailed job information including all relations
     */
    async findOne(id: number): Promise<Job> {
        const job = await this.prisma.job.findUnique({
            where: { id },
            include: {
                company: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                metadata: true,
                sources: true,
            },
        });

        if (!job) {
            throw new NotFoundException(`Job with ID ${id} not found`);
        }

        return job;
    }

    /**
     * Update an existing job listing
     * Updates job information and associated data
     */
    async update(id: number, updateJobDto: UpdateJobDto, userId?: number): Promise<Job> {
        const existingJob = await this.findOne(id);

        const { title, companyName, companyId, author, location, url, description, isRemote, tags, metadata } = updateJobDto;

        // Handle company update
        let company: Company | null = null;
        if (companyId) {
            company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new BadRequestException('Company not found');
            }
        } else if (companyName) {
            company = await this.prisma.company.upsert({
                where: { name: companyName },
                update: {},
                create: { name: companyName },
            });
        }

        // Update job with transaction to handle related data
        const updatedJob = await this.prisma.$transaction(async (prisma) => {
            // Update the main job record
            const job = await prisma.job.update({
                where: { id },
                data: {
                    ...(title && { title }),
                    ...(company && { companyId: company.id }),
                    ...(author !== undefined && { author }),
                    ...(location !== undefined && { location }),
                    ...(url && { url }),
                    ...(description !== undefined && { description }),
                    ...(isRemote !== undefined && { isRemote }),
                },
            });

            // Update tags if provided
            if (tags) {
                // Remove existing tags
                await prisma.jobTag.deleteMany({
                    where: { jobId: id },
                });

                // Add new tags
                if (tags.length > 0) {
                    for (const tagName of tags) {
                        const tag = await prisma.tag.upsert({
                            where: { name: tagName },
                            update: {},
                            create: { name: tagName },
                        });

                        await prisma.jobTag.create({
                            data: {
                                jobId: id,
                                tagId: tag.id,
                            },
                        });
                    }
                }
            }

            // Update metadata if provided
            if (metadata) {
                // Remove existing metadata
                await prisma.jobMetadata.deleteMany({
                    where: { jobId: id },
                });

                // Add new metadata
                if (metadata.length > 0) {
                    await prisma.jobMetadata.createMany({
                        data: metadata.map((meta) => ({
                            jobId: id,
                            name: meta.name,
                            value: meta.value,
                        })),
                    });
                }
            }

            return job;
        });

        return this.findOne(id);
    }

    /**
     * Remove a job listing
     * Deletes the job and all associated data
     */
    async remove(id: number, userId?: number): Promise<{ message: string }> {
        const job = await this.findOne(id);

        await this.prisma.$transaction(async (prisma) => {
            // Delete related data first
            await prisma.jobTag.deleteMany({ where: { jobId: id } });
            await prisma.jobMetadata.deleteMany({ where: { jobId: id } });
            await prisma.jobSource.deleteMany({ where: { jobId: id } });

            // Delete the job
            await prisma.job.delete({ where: { id } });
        });

        return { message: `Job with ID ${id} has been successfully deleted` };
    }

    /**
     * Find jobs by company
     * Returns all jobs for a specific company with pagination
     */
    async findByCompany(companyId: number, paginationArgs: PaginationArgs, orderBy?: JobOrderByDto) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            throw new NotFoundException(`Company with ID ${companyId} not found`);
        }

        const where = { companyId };
        const orderByClause = this.buildOrderBy(orderBy);

        // Handle pagination
        const take = paginationArgs.first || 10;
        const skip = paginationArgs.skip || 0;

        const [jobs, totalCount] = await Promise.all([
            this.prisma.job.findMany({
                where,
                orderBy: orderByClause,
                skip,
                take,
                include: {
                    company: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    metadata: true,
                    sources: true,
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return {
            jobs,
            company,
            totalCount,
            pageInfo: {
                hasNextPage: skip + take < totalCount,
                hasPreviousPage: skip > 0,
                startCursor: skip,
                endCursor: skip + jobs.length,
            },
        };
    }

    /**
     * Find jobs by tag
     * Returns all jobs that have a specific tag
     */
    async findByTag(tagName: string, paginationArgs: PaginationArgs, orderBy?: JobOrderByDto) {
        const tag = await this.prisma.tag.findUnique({
            where: { name: tagName },
        });

        if (!tag) {
            throw new NotFoundException(`Tag '${tagName}' not found`);
        }

        const where = {
            tags: {
                some: {
                    tagId: tag.id,
                },
            },
        };

        const orderByClause = this.buildOrderBy(orderBy);

        // Handle pagination
        const take = paginationArgs.first || 10;
        const skip = paginationArgs.skip || 0;

        const [jobs, totalCount] = await Promise.all([
            this.prisma.job.findMany({
                where,
                orderBy: orderByClause,
                skip,
                take,
                include: {
                    company: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    metadata: true,
                    sources: true,
                },
            }),
            this.prisma.job.count({ where }),
        ]);

        return {
            jobs,
            tag,
            totalCount,
            pageInfo: {
                hasNextPage: skip + take < totalCount,
                hasPreviousPage: skip > 0,
                startCursor: skip,
                endCursor: skip + jobs.length,
            },
        };
    }

    /**
     * Build Prisma orderBy clause from DTO
     * Handles sorting options for job queries
     */
    private buildOrderBy(orderBy?: JobOrderByDto) {
        if (!orderBy) {
            return { createdAt: 'desc' as const };
        }

        const orderByClause: any = {};

        if (orderBy.createdAt) {
            orderByClause.createdAt = orderBy.createdAt;
        }
        if (orderBy.updatedAt) {
            orderByClause.updatedAt = orderBy.updatedAt;
        }
        if (orderBy.postedAt) {
            orderByClause.postedAt = orderBy.postedAt;
        }
        if (orderBy.title) {
            orderByClause.title = orderBy.title;
        }
        if (orderBy.company) {
            orderByClause.company = {
                name: orderBy.company,
            };
        }

        return Object.keys(orderByClause).length > 0 ? orderByClause : { createdAt: 'desc' as const };
    }
}
