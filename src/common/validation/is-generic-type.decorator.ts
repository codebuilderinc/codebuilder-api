import { ValidationArguments, ValidationOptions, ValidateBy, isNumber, isString, isNumberString, isInt, isArray, isBoolean } from 'class-validator';
import { isBigInt } from 'class-validator-extended';

const InnerTypesValidator = {
  number: isNumber,
  string: isString,
  numberString: isNumberString,
  int: isInt,
  array: isArray,
  bigint: isBigInt,
  boolean: isBoolean,
};

export const IsGenericType = (validators: (keyof typeof InnerTypesValidator | ((value: any) => boolean))[], validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'IS_GENERIC_TYPE',
      validator: {
        validate: (value: unknown) => {
          return validators.some((item) => (typeof item === 'function' ? item(value) : InnerTypesValidator[item]?.(value)));
        },
        defaultMessage: (validationArguments?: ValidationArguments) => {
          return `${validationArguments?.property}: Data type mismatch`;
        },
      },
    },
    validationOptions,
  );
