/**
 * Utility functions for error handling
 */

/**
 * Type guard to check if error is a PostgreSQL error with a code
 */
export function isPostgresError(error: unknown): error is { code: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

/**
 * Check if error is a PostgreSQL duplicate key error (code 23505)
 */
export function isDuplicateKeyError(error: unknown): boolean {
  return isPostgresError(error) && error.code === '23505';
}
