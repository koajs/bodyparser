import deepMerge from 'lodash.merge';
import {
  type BodyParserOptions,
  supportedBodyTypes,
  type BodyType,
} from './body-parser.types';

export class UnsupportedBodyTypeError extends Error {
  constructor(wrongType: string) {
    super();
    this.name = 'UnsupportedBodyTypeError';
    this.message =
      `Invalid enabled type '${wrongType}'.` +
      ` make sure to pass an array contains ` +
      `supported types ([${supportedBodyTypes}]).`;
  }
}

/**
 * Utility which help us to check if the body type enabled
 */
export function getIsEnabledBodyAs(enableTypes: BodyType[]) {
  for (const enabledType of enableTypes) {
    if (!supportedBodyTypes.includes(enabledType)) {
      throw new UnsupportedBodyTypeError(enabledType);
    }
  }

  const isEnabledBodyAs = supportedBodyTypes.reduce(
    (prevResult, currentType) => ({
      ...prevResult,
      [currentType]: enableTypes.includes(currentType),
    }),
    {} as NonNullable<BodyParserOptions['extendTypes']>,
  );

  return isEnabledBodyAs;
}

/**
 * Utility which help us to merge the extended mime types with our base
 */
export function getMimeTypes(
  extendTypes: NonNullable<BodyParserOptions['extendTypes']>,
) {
  for (const extendedTypeKey of Object.keys(extendTypes) as BodyType[]) {
    const extendedType = extendTypes[extendedTypeKey];

    if (
      !supportedBodyTypes.includes(extendedTypeKey) ||
      !Array.isArray(extendedType)
    ) {
      throw new UnsupportedBodyTypeError(extendedTypeKey);
    }
  }

  const defaultMimeTypes = {
    // default json mime types
    json: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
      'application/scim+json',
    ],
    // default form mime types
    form: ['application/x-www-form-urlencoded'],
    // default text mime types
    text: ['text/plain'],
    // default xml mime types
    xml: ['text/xml', 'application/xml'],
  };
  const mimeTypes = deepMerge(defaultMimeTypes, extendTypes);

  return mimeTypes;
}
