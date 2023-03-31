import deepMerge from 'lodash.merge';
import {
  type BodyParserOptions,
  supportedBodyTypes,
  type BodyType,
} from './body-parser.types';

/**
 * Utility which help us to check if the body type enabled
 */
export function getIsEnabledBodyAs(enableTypes: BodyType[]) {
  for (const enabledType of enableTypes) {
    if (!supportedBodyTypes.includes(enabledType)) {
      throw new Error(
        `Invalid enabled type '${enabledType}'.` +
          ` make sure to pass an array contains ` +
          `supported types ([${supportedBodyTypes}]).`,
      );
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
  for (const extendedType of Object.keys(extendTypes) as BodyType[]) {
    if (!supportedBodyTypes.includes(extendedType)) {
      throw new Error(
        `Invalid extend type '${extendedType}'.` +
          ` make sure to pass supported types ([${supportedBodyTypes}]).`,
      );
    }

    if (!Array.isArray(extendTypes[extendedType])) {
      throw new TypeError(
        'Invalid extend type value. make sure to pass an array of strings.',
      );
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
