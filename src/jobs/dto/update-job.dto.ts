import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsBoolean, IsArray, IsUrl, Length, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field as GraphQLField } from '@nestjs/graphql';
import { pick } from './../../common/helpers/array.helper';
import { JobMetadataDto } from './create-job.dto';

/**
 * Update Job DTO
 *
 * Data Transfer Object for updating existing job listings.
 * All fields are optional since this is for partial updates.
 *
 * Allows updating:
 * - Basic job information (title, description, location)
 * - Company association
 * - Job status (remote, posted date)
 * - Tags and metadata
 */
@InputType()
export class UpdateJobDto {
    @ApiProperty({
        description: 'Job title',
        example: 'Senior Software Engineer',
        required: false,
    })
    @GraphQLField({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    title?: string;

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
        required: false,
    })
    @GraphQLField({ nullable: true })
    @IsOptional()
    @IsUrl()
    url?: string;

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
        description: 'Job tags/skills (replaces existing tags)',
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
        description: 'Additional job metadata (replaces existing metadata)',
        required: false,
        type: [JobMetadataDto],
    })
    @GraphQLField(() => [JobMetadataDto], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JobMetadataDto)
    metadata?: JobMetadataDto[];
}
