/**
 * Converts a kebab-case string to Title Case.
 *
 * @param str - The kebab-case string to convert.
 * @returns The converted string in Title Case, where each word starts with an uppercase letter.
 *
 * @example
 * ```typescript
 * kebabCaseToTitleCase('hello-world'); // Returns 'Hello World'
 * kebabCaseToTitleCase('my-example-string'); // Returns 'My Example String'
 * ```
 */
export const kebabCaseToTitleCase = (str: string): string => {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Checks if a given string is a valid JSON string representation.
 *
 * @param str - The string to be checked.
 * @returns `true` if the string is a valid JSON string representation of an object, otherwise `false`.
 */
export const isStringifiedJSON = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};
