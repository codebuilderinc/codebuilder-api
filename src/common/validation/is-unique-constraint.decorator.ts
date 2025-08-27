import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { PrismaService } from 'nestjs-prisma';
import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from './../database/database.service';
// const swap = await this.databaseService.position.findFirst({

@ValidatorConstraint({ name: 'isUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    private readonly databaseService: DatabaseService,
    private prisma: PrismaService
  ) {}

  async validate(value: string, args: ValidationArguments) {
    const [entity, column] = args.constraints;

    let result = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM $1 WHERE $2 = $3 WHERE LIMIT 1`,
      entity,
      column,
      value
    );

    if (result) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `"${args.value}" already exists for ${args.constraints[1]}`;
  }
}

export function IsUnique(entity: Function, column: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, column],
      validator: IsUniqueConstraint,
    });
  };
}
