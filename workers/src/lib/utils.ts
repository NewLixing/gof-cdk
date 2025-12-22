/**
 * Generate MD5 hash (using Web Crypto API)
 */
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate signed object for API requests
 */
export async function generateSignedObject(
  inputObject: Record<string, any>,
  salt: string
): Promise<string> {
  const sortedKeys = Object.keys(inputObject).sort();
  const signatureData: Record<string, any> = {};
  
  for (const key of sortedKeys) {
    signatureData[key] = inputObject[key];
  }
  
  const signStr = Object.entries(signatureData)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  const sign = await md5(signStr + salt);
  
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
