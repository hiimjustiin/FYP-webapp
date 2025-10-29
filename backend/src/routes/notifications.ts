import { Router, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticate } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

const router: Router = Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await notificationService.getUserNotifications(
      req.user?.id || '',
      limit
    );

    res.json({ success: true, data: { notifications } });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch notifications' },
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id as string;
    const userId = req.user?.id || '';
    await notificationService.markAsRead(notificationId, userId);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark notification as read' },
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user?.id || '');
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark all notifications as read' },
    });
  }
});

export default router;
