import CryptoJS from 'crypto-js';

/**
 * Generate signed object for API requests
 */
export function generateSignedObject(
  inputObject: Record<string, any>,
  salt: string
): string {
  const sortedKeys = Object.keys(inputObject).sort();
  const signatureData: Record<string, any> = {};
  
  for (const key of sortedKeys) {
    signatureData[key] = inputObject[key];
  }
  
  const signStr = Object.entries(signatureData)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  const sign = CryptoJS.MD5(signStr + salt).toString();
  
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(signatureData)) {
    result.append(key, String(value));
  }
  result.append('sign', sign);
  
  return result.toString();
}

/**
 * Sleep utility function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique task ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
