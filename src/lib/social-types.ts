export interface SocialActionResult {
  success?: boolean;
  error?: string;
  code?:
    | 'AUTH_REQUIRED'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'UNKNOWN_ERROR';
}

