// Third-party imports with versions
import { format, parse, isValid } from 'date-fns'; // v2.23.0

/**
 * Validates if a date object or string is valid.
 * Used for validating search filter dates and document timestamps.
 * 
 * @param date - Date object or string to validate
 * @returns boolean indicating if the date is valid
 */
export const isValidDate = (date: Date | string): boolean => {
  // Check for null/undefined
  if (!date) {
    return false;
  }

  // Convert string to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Use date-fns isValid for basic validation
  if (!isValid(dateObj)) {
    return false;
  }

  // Check if date is within reasonable range (1900-2100)
  const year = dateObj.getFullYear();
  if (year < 1900 || year > 2100) {
    return false;
  }

  return true;
};

/**
 * Formats a date object into a specified string format for consistent display
 * across the dashboard UI.
 * 
 * @param date - Date object to format
 * @param formatString - Format string (e.g., 'yyyy-MM-dd')
 * @returns Formatted date string
 * @throws Error if date is invalid
 */
export const formatDate = (date: Date, formatString: string): string => {
  // Validate the input date
  if (!isValidDate(date)) {
    throw new Error(`Invalid date provided: ${date}`);
  }

  try {
    // Handle timezone conversion by ensuring UTC consistency
    const utcDate = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      )
    );

    // Use date-fns format with the specified format string
    return format(utcDate, formatString);
  } catch (error) {
    throw new Error(`Error formatting date: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parses a date string into a Date object.
 * Used for processing user inputs in search filters and form fields.
 * 
 * @param dateString - String representation of date
 * @param formatString - Expected format of the date string
 * @returns Parsed Date object
 * @throws Error if parsing fails or date is invalid
 */
export const parseDate = (dateString: string, formatString: string): Date => {
  // Trim and sanitize input
  const sanitizedDateString = dateString.trim();
  
  if (!sanitizedDateString) {
    throw new Error('Empty date string provided');
  }

  try {
    // Use date-fns parse to convert string to Date
    const parsedDate = parse(sanitizedDateString, formatString, new Date());

    // Validate the parsed date
    if (!isValidDate(parsedDate)) {
      throw new Error(`Invalid date format. Expected format: ${formatString}`);
    }

    // Handle timezone adjustments
    const utcDate = new Date(
      Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        parsedDate.getHours(),
        parsedDate.getMinutes(),
        parsedDate.getSeconds()
      )
    );

    return utcDate;
  } catch (error) {
    throw new Error(
      `Error parsing date "${dateString}" with format "${formatString}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};