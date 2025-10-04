import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MinLength,
  ValidateNested,
  IsDateString,
  IsJSON,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field as GraphQLField } from '@nestjs/graphql';

/**
 * DTO for job metadata key-value pairs
 * Used to store additional job information not covered by main fields
 */
export class JobMetadataDto {
  @ApiProperty({
    description: 'Metadata key name',
    example: 'salary_range',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Metadata value',
    example: '$80,000 - $120,000',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

/**
 * Create Job DTO
 *
 * Data Transfer Object for creating new job listings.
 * Contains all the required and optional fields for job creation.
 *
 * Required fields:
 * - title: Job title
 * - url: Unique job URL
 *
 * Optional fields:
 * - Company information (either companyId or companyName)
 * - Job details (description, location, remote status)
 * - Tags for categorization
 * - Metadata for additional information
 * - Source information for tracking provenance
 */
@InputType()
export class CreateJobDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer',
    minLength: 1,
    maxLength: 255,
  })
  @GraphQLField()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: 'Company ID (existing company)',
    example: 1,
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiProperty({
    description: 'Company name (will create if not exists)',
    example: 'Tech Corp Inc',
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  companyName?: string;

  @ApiProperty({
    description: 'Job post author',
    example: 'john_doe',
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  author?: string;

  @ApiProperty({
    description: 'Job location',
    example: 'San Francisco, CA',
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @ApiProperty({
    description: 'Unique job URL',
    example: 'https://company.com/jobs/senior-engineer',
  })
  @GraphQLField()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'When the job was originally posted',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsDateString()
  postedAt?: string;

  @ApiProperty({
    description: 'Job description',
    example: 'We are looking for a skilled software engineer...',
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Is this a remote position?',
    example: true,
    required: false,
  })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @ApiProperty({
    description: 'Job tags/skills',
    example: ['TypeScript', 'Node.js', 'React'],
    required: false,
    type: [String],
  })
  @GraphQLField(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Additional job metadata',
    required: false,
    type: [JobMetadataDto],
  })
  @GraphQLField(() => [JobMetadataDto], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobMetadataDto)
  metadata?: JobMetadataDto[];

  @ApiProperty({ description: 'Source system name', example: 'reddit', required: false })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: 'External ID from source system', example: 't3_abc123', required: false })
  @GraphQLField({ nullable: true })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ description: 'Raw source data as JSON', required: false })
  @GraphQLField({ nullable: true })
  @IsOptional()
  data?: any;
}
