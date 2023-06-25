import deepMerge from 'lodash.merge';
import typeis from 'type-is';
import {
  type BodyParserOptions,
  supportedBodyTypes,
  type BodyType,
} from './body-parser.types';

/**
 * UnsupportedBodyTypeError
 */
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
      'application/reports+json',
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

/**
 * Check if the incoming request contains the "Content-Type" header
 * field, and it contains any of the give mime types. If there
 * is no request body, null is returned. If there is no content type,
 * false is returned. Otherwise, it returns the first type that matches.
 */
export function isTypes(contentTypeValue: string, types: string[]) {
  if (typeof contentTypeValue === 'string') {
    // trim extra semicolon
    contentTypeValue = contentTypeValue.replace(/;$/, '');
  }

  return typeis.is(contentTypeValue, types);
}
