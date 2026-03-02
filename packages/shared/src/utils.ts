/**
 * Utility functions shared across frontend and backend
 */

/**
 * Format stack size to readable string (e.g., 100 -> "100bb")
 */
export function formatStack(bb: number): string {
  return `${bb}bb`;
}

/**
 * Format pot size with proper pluralization
 */
export function formatPot(amount: number): string {
  return `${amount} BB${amount !== 1 ? 's' : ''}`;
}

/**
 * Generate a stable hash from a string (simple DJB2)
 */
export function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Sanitize user input text
 */
export function sanitizeText(text: string, maxLength: number = 5000): string {
  return text.slice(0, maxLength).trim();
}

/**
 * Parse board cards (basic validation)
 */
export function parseBoardCards(board: string): string[] | null {
  const cards = board.trim().toUpperCase().match(/[AKQJT98765432][SHDC]/g);
  return cards && cards.length >= 3 && cards.length <= 5 ? cards : null;
}

/**
 * Format frequency as percentage
 */
export function formatFrequency(freq: number): string {
  return `${freq.toFixed(1)}%`;
}

/**
 * Get confidence color class
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'green';
  if (confidence >= 70) return 'yellow';
  return 'red';
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a request cache key from object
 */
export function createCacheKey(obj: any): string {
  return simpleHash(JSON.stringify(obj));
}
