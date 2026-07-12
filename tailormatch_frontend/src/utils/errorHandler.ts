/**
 * Utility functions for handling API errors with specific error messages
 */

export interface ApiError {
  response?: {
    data?: {
      error?: string;
      detail?: string;
      details?: Record<string, any>;
      message?: string;
      [key: string]: any;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract specific error message from API error response
 */
export const getErrorMessage = (error: ApiError): string => {
  if (!error.response?.data) {
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  const errorData = error.response.data;

  // Handle field-specific errors in 'details' object first
  if (errorData.details) {
    const fieldErrors = Object.entries(errorData.details)
      .map(([field, errors]) => {
        const errorArray = Array.isArray(errors) ? errors : [errors];
        return `${field}: ${errorArray[0]}`;
      })
      .join(', ');
    
    if (fieldErrors) {
      return fieldErrors;
    }
  }

  // Handle direct field validation errors (keys that aren't common metadata keys)
  const fieldErrors = Object.entries(errorData)
    .filter(([key]) => key !== 'error' && key !== 'detail' && key !== 'message' && key !== 'details')
    .map(([field, errors]) => {
      const errorArray = Array.isArray(errors) ? errors : [errors];
      return `${field}: ${errorArray[0]}`;
    })
    .join(', ');

  if (fieldErrors) {
    return fieldErrors;
  }

  // Handle different general error response formats
  if (errorData.detail) {
    return errorData.detail;
  }

  if (errorData.message) {
    return errorData.message;
  }

  if (errorData.error) {
    return errorData.error;
  }

  // Default fallback
  return 'An error occurred. Please try again.';
};

/**
 * Get specific field error message
 */
export const getFieldError = (error: ApiError, fieldName: string): string | null => {
  if (!error.response?.data) {
    return null;
  }

  const errorData = error.response.data;
  
  // Check for field-specific errors
  if (errorData[fieldName]) {
    const fieldError = errorData[fieldName];
    return Array.isArray(fieldError) ? fieldError[0] : fieldError;
  }

  // Check in details object
  if (errorData.details && errorData.details[fieldName]) {
    const fieldError = errorData.details[fieldName];
    return Array.isArray(fieldError) ? fieldError[0] : fieldError;
  }

  return null;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: ApiError): boolean => {
  if (error.response?.status !== 400) {
    return false;
  }
  
  const errorData = error.response.data;
  if (!errorData) {
    return false;
  }
  
  // Check if there are details or field-specific errors
  return !!(errorData.details || 
           Object.keys(errorData).some(key => 
             key !== 'error' && key !== 'detail' && key !== 'message'
           ));
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: ApiError): boolean => {
  return error.response?.status === 401;
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error: ApiError): boolean => {
  return error.response?.status === 403;
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error: ApiError): boolean => {
  return error.response?.status === 404;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error: ApiError): boolean => {
  return error.response?.status ? error.response.status >= 500 : false;
};

/**
 * Get user-friendly error message based on error type
 */
export const getUserFriendlyMessage = (error: ApiError): string => {
  if (isAuthError(error)) {
    return 'Please sign in to continue.';
  }

  if (isPermissionError(error)) {
    return 'You do not have permission to perform this action.';
  }

  if (isNotFoundError(error)) {
    return 'The requested resource was not found.';
  }

  if (isServerError(error)) {
    return 'Server error occurred. Please try again later.';
  }

  return getErrorMessage(error);
};
