/**
 * Security utilities for safe HTML handling and input validation
 */

/**
 * Escapes HTML characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Creates a safe HTML element with escaped content
 */
export function createSafeElement(tag: string, content: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = content; // This automatically escapes
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Validates and sanitizes search query input
 */
export function validateSearchQuery(query: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!query || typeof query !== 'string') {
    return { isValid: false, sanitized: '', error: 'Query is required' };
  }

  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Query cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, sanitized: '', error: 'Query too long (max 100 characters)' };
  }

  // Remove potentially dangerous characters but keep basic ones for restaurant names
  const sanitized = trimmed.replace(/[<>\\"'&]/g, '');
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Query contains invalid characters' };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates location coordinates
 */
export function validateLocation(location: any): { isValid: boolean; error?: string } {
  if (!location) {
    return { isValid: true }; // Location is optional
  }

  if (typeof location !== 'object' || !location.lat || !location.lng) {
    return { isValid: false, error: 'Invalid location format' };
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, error: 'Location coordinates must be numbers' };
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true };
}

/**
 * Generic error response for edge functions
 */
export function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ error: 'An error occurred while processing your request' }),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    }
  );
}
