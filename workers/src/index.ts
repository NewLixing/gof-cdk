import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, BatchTaskRequest } from './types';
import { TaskManager } from './lib/task-manager';
import { SubscriptionManager } from './lib/subscription-manager';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors({
  origin: '*', // TODO: In production, restrict to specific domains
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'GOF-CDK Worker API - Subscription Mode',
    version: '2.0.0',
    status: 'healthy',
  });
});

/**
 * POST /api/players/subscribe
 * Subscribe a player
 */
app.post('/api/players/subscribe', async (c) => {
  try {
    const body = await c.req.json<{ fid: string }>();
    
    if (!body.fid || typeof body.fid !== 'string') {
      return c.json({ error: 'Invalid player ID' }, 400);
    }

    const subscriptionManager = new SubscriptionManager(c.env);
    const player = await subscriptionManager.subscribePlayer(body.fid);

    return c.json({
      success: true,
      data: player,
    });
  } catch (error) {
    console.error('Failed to subscribe player:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/players
 * Get all subscribed players
 */
app.get('/api/players', async (c) => {
  try {
    const subscriptionManager = new SubscriptionManager(c.env);
    const players = await subscriptionManager.getPlayers();

    return c.json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error('Failed to get players:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * DELETE /api/players/:fid
 * Unsubscribe a player
 */
app.delete('/api/players/:fid', async (c) => {
  try {
    const fid = c.req.param('fid');
    
    if (!fid) {
      return c.json({ error: 'Player ID is required' }, 400);
    }

    const subscriptionManager = new SubscriptionManager(c.env);
    const success = await subscriptionManager.unsubscribePlayer(fid);

    if (!success) {
      return c.json({ error: 'Player not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Player unsubscribed',
    });
  } catch (error) {
    console.error('Failed to unsubscribe player:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/giftcodes
 * Add a gift code
 */
app.post('/api/giftcodes', async (c) => {
  try {
    const body = await c.req.json<{ code: string; description?: string }>();
    
    if (!body.code || typeof body.code !== 'string') {
      return c.json({ error: 'Invalid gift code' }, 400);
    }

    const subscriptionManager = new SubscriptionManager(c.env);
    const giftCode = await subscriptionManager.addGiftCode(body.code, body.description);

    return c.json({
      success: true,
      data: giftCode,
    });
  } catch (error) {
    console.error('Failed to add gift code:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/giftcodes
 * Get all gift codes (active and expired)
 */
app.get('/api/giftcodes', async (c) => {
  try {
    const subscriptionManager = new SubscriptionManager(c.env);
    const active = await subscriptionManager.getActiveGiftCodes();
    const expired = await subscriptionManager.getExpiredGiftCodes();

    return c.json({
      success: true,
      data: {
        active,
        expired,
      },
    });
  } catch (error) {
    console.error('Failed to get gift codes:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * DELETE /api/giftcodes/:code
 * Delete a gift code
 */
app.delete('/api/giftcodes/:code', async (c) => {
  try {
    const code = c.req.param('code');
    
    if (!code) {
      return c.json({ error: 'Gift code is required' }, 400);
    }

    const subscriptionManager = new SubscriptionManager(c.env);
    const success = await subscriptionManager.deleteGiftCode(code);

    if (!success) {
      return c.json({ error: 'Gift code not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Gift code deleted',
    });
  } catch (error) {
    console.error('Failed to delete gift code:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/redeem/auto
 * Manually trigger auto redemption
 */
app.post('/api/redeem/auto', async (c) => {
  try {
    const subscriptionManager = new SubscriptionManager(c.env);
    const results = await subscriptionManager.autoRedeemAll();

    return c.json({
      success: true,
      message: `Processed ${results.length} redemptions`,
      data: results,
    });
  } catch (error) {
    console.error('Failed to auto redeem:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/redemptions
 * Get redemption history
 */
app.get('/api/redemptions', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 100;
    
    const subscriptionManager = new SubscriptionManager(c.env);
    const history = await subscriptionManager.getRedemptionHistory(limit);

    return c.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Failed to get redemption history:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/batch
 * Submit batch task
 * Body: { fids: string[], cdks: string[] }
 * Returns: { taskIds: { fid: string, taskId: string }[] }
 */
app.post('/api/batch', async (c) => {
  try {
    const body = await c.req.json<BatchTaskRequest>();
    
    // Validate input
    if (!body.fids || !Array.isArray(body.fids) || body.fids.length === 0) {
      return c.json({ error: 'Invalid fids array' }, 400);
    }
    
    if (!body.cdks || !Array.isArray(body.cdks) || body.cdks.length === 0) {
      return c.json({ error: 'Invalid cdks array' }, 400);
    }

    const taskManager = new TaskManager(c.env);
    const taskIds: { fid: string; taskId: string }[] = [];

    // Create a task for each player
    for (const fid of body.fids) {
      const taskId = await taskManager.createTask(fid, body.cdks);
      taskIds.push({ fid, taskId });
    }

    return c.json({
      success: true,
      message: `Created ${taskIds.length} tasks`,
      data: taskIds,
    });
  } catch (error) {
    console.error('Batch task creation failed:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/status/:taskId
 * Get task status
 * Returns: TaskStatus
 */
app.get('/api/status/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId');
    
    if (!taskId) {
      return c.json({ error: 'Task ID is required' }, 400);
    }

    const taskManager = new TaskManager(c.env);
    const status = await taskManager.getTaskStatus(taskId);

    if (!status) {
      return c.json({ error: 'Task not found' }, 404);
    }

    return c.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Failed to get task status:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/history
 * Get task history
 * Returns: Array of task history records
 */
app.get('/api/history', async (c) => {
  try {
    const limit = Number(c.req.query('limit')) || 100;
    
    const taskManager = new TaskManager(c.env);
    const history = await taskManager.getHistory(limit);

    return c.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Failed to get history:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500);
});

export default app;
