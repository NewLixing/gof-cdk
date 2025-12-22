import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, BatchTaskRequest } from './types';
import { TaskManager } from './lib/task-manager';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors({
  origin: '*', // TODO: In production, restrict to specific domains
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'GOF-CDK Worker API',
    version: '1.0.0',
    status: 'healthy',
  });
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
