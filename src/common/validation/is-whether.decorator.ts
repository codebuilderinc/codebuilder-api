import { isNumberString, registerDecorator, ValidateBy, ValidationArguments } from 'class-validator';

export const isWhether = (value: string, ...validators: ((value: any) => boolean)[]) => {
  return validators.map((validate) => validate(value)).some((valid) => valid);
};

export function IsWhether(...validators: [string, (value: any) => boolean][]) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isWhetherType',
      target: object.constructor,
      propertyName: propertyName,
      options: {},
      validator: {
        validate(value: any) {
          const validatorsFns = validators.map(([type, validate]) => validate).flat();
          return isWhether(value, ...validatorsFns);
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          const types = validators.map(([type]) => type).flat();
          const lastType = types.pop();
          if (types.length === 0) return `${propertyName} has to be ${lastType}`;
          return `${propertyName} can only be ${types.join(', ')} or ${lastType}.`;
        },
      },
    });
  };
}

/* USAGE:
export class UpdateDTO {
  @Expose()
  @IsWhether(['file', isFile], ['string', isString])
  @IsOptional()
  avatar?: MemoryStoredFile | string
}
*/
