import type { SubscribedPlayer, GiftCode, RedemptionRecord } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

/**
 * Subscribe a player
 */
export async function subscribePlayer(fid: string): Promise<{
  success: boolean;
  data?: SubscribedPlayer;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fid }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to subscribe player:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all subscribed players
 */
export async function getPlayers(): Promise<{
  success: boolean;
  data?: SubscribedPlayer[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get players:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unsubscribe a player
 */
export async function unsubscribePlayer(fid: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/${fid}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to unsubscribe player:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add a gift code
 */
export async function addGiftCode(code: string, description?: string): Promise<{
  success: boolean;
  data?: GiftCode;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/giftcodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, description }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to add gift code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all gift codes
 */
export async function getGiftCodes(): Promise<{
  success: boolean;
  data?: { active: GiftCode[]; expired: GiftCode[] };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/giftcodes`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get gift codes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a gift code
 */
export async function deleteGiftCode(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/giftcodes/${code}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to delete gift code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Trigger auto redemption
 */
export async function triggerAutoRedeem(): Promise<{
  success: boolean;
  data?: RedemptionRecord[];
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/redeem/auto`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to trigger auto redeem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get redemption history
 */
export async function getRedemptionHistory(limit = 100): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/redemptions?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get redemption history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
