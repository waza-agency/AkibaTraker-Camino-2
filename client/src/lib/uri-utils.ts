/**
 * Utility functions for safely handling URIs throughout the application
 */

/**
 * Safely encodes a URI, handling potential malformed strings
 * @param uri The URI string to encode
 * @returns The safely encoded URI string
 */
export function safeEncodeURI(uri: string): string {
  if (!uri) return '';
  
  try {
    // First fix any malformed percent encodings
    const fixedUri = uri.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
    return encodeURI(fixedUri);
  } catch (error) {
    console.error('Error encoding URI:', error);
    // Try to salvage by encoding parts of the string
    try {
      // Split by common delimiters and encode each part
      return uri.split(/([\/\?&=:])/).map(part => {
        try {
          return encodeURIComponent(part);
        } catch {
          return part;
        }
      }).join('');
    } catch (e) {
      console.error('Failed to salvage URI:', e);
      return '';
    }
  }
}

/**
 * Safely decodes a URI, handling potential malformed strings
 * @param uri The URI string to decode
 * @returns The safely decoded URI string, or the original if decoding fails
 */
export function safeDecodeURI(uri: string): string {
  if (!uri) return '';
  
  try {
    // First fix any malformed percent encodings
    const fixedUri = uri.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
    return decodeURI(fixedUri);
  } catch (error) {
    console.error('Error decoding URI:', error);
    return uri; // Return the original URI if decoding fails
  }
}

/**
 * Safely normalizes a URL, handling both absolute and relative URLs
 * @param url The URL to normalize
 * @param baseUrl Optional base URL for relative URLs (defaults to window.location.origin)
 * @returns The normalized URL string
 */
export function normalizeUrl(url: string, baseUrl?: string): string {
  if (!url) return '';
  
  try {
    // If it's a relative URL and we have a base, make it absolute
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const absoluteUrl = url.startsWith('/') && base ? `${base}${url}` : url;
    
    // Fix malformed percent-encoded sequences if present
    if (absoluteUrl.includes('%')) {
      const fixedUrl = absoluteUrl.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
      
      // Validate URL by constructing a URL object
      new URL(fixedUrl);
      return fixedUrl;
    }
    
    // If no percent encoding issues, just validate and return
    new URL(absoluteUrl);
    return absoluteUrl;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    
    // Try to salvage the URL
    try {
      return safeEncodeURI(url);
    } catch (e) {
      console.error('Failed to salvage URL:', e);
      return '';
    }
  }
} 