/**
 * Admin Notifications API Routes
 * GET: Fetch notifications with filters
 * POST: Create a new notification
 * PATCH: Mark notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAccess } from '@/lib/auth/adminAuth';
import type { NotificationFilters } from '@/types/notifications';

/**
 * GET /api/admin/notifications
 * Fetch notifications with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: NotificationFilters = {
      type: (searchParams.get('type') as any) || undefined,
      category: (searchParams.get('category') as any) || undefined,
      priority: (searchParams.get('priority') as any) || undefined,
      is_read:
        searchParams.get('is_read') === 'true'
          ? true
          : searchParams.get('is_read') === 'false'
            ? false
            : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Build query
    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.is_read !== undefined) query = query.eq('is_read', filters.is_read);

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { data: unreadCount } = await supabase.rpc('get_unread_notification_count');

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount || 0,
      total: notifications?.length || 0,
    });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/notifications
 * Create a new notification manually
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();

    const {
      type,
      title,
      message,
      priority = 'normal',
      category = 'general',
      metadata = {},
      action_url,
      action_label,
    } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create notification for all admins
    const { data, error } = await supabase.rpc('create_admin_notification', {
      p_type: type,
      p_title: title,
      p_message: message,
      p_priority: priority,
      p_category: category,
      p_metadata: metadata,
      p_action_url: action_url || null,
      p_action_label: action_label || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification_ids: data });
  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();

    const { notification_id, mark_all } = body;

    if (mark_all) {
      // Mark all as read
      const { data: count, error } = await supabase.rpc('mark_all_notifications_read');

      if (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, updated_count: count });
    } else if (notification_id) {
      // Mark single notification as read
      const { data: success, error } = await supabase.rpc('mark_notification_read', {
        notification_id,
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
      }

      return NextResponse.json({ success });
    } else {
      return NextResponse.json(
        { error: 'Missing notification_id or mark_all flag' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in notifications PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/notifications
 * Delete a notification
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }

    const { error } = await supabase.from('admin_notifications').delete().eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notifications DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
