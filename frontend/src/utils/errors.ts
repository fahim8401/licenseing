/**
 * Utility functions for error handling
 */

/**
 * Extract error message from Axios error response
 */
export function extractAxiosErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'error' in error.response.data
  ) {
    return String(error.response.data.error);
  }
  return defaultMessage;
}
