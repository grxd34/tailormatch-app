import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationsAPI } from '../services/api';
import { Notification, WebSocketMessage } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const queryClient = useQueryClient();
  const { totalUnreadCount, hasAnyUnread } = useUnreadMessages();

  const { data: notifications, isLoading, error } = useQuery(
    'notifications',
    notificationsAPI.getAll
  );

  const markAsReadMutation = useMutation(notificationsAPI.markAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  const deleteNotificationMutation = useMutation(notificationsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      toast.success('Notification deleted');
      setShowDeleteDialog(false);
      setNotificationToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  const clearAllNotificationsMutation = useMutation(notificationsAPI.clearAll, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      toast.success('All notifications cleared');
      setShowClearAllDialog(false);
    },
    onError: () => {
      toast.error('Failed to clear notifications');
    },
  });

  // WebSocket for real-time notifications
  useWebSocket((message: WebSocketMessage) => {
    if (message.type === 'notification' && message.notification) {
      toast.success(message.notification.title);
      queryClient.invalidateQueries('notifications');
    }
  });

  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDeleteNotification = (notification: Notification) => {
    setNotificationToDelete(notification);
    setShowDeleteDialog(true);
  };

  const handleClearAllNotifications = () => {
    setShowClearAllDialog(true);
  };

  const confirmDeleteNotification = () => {
    if (notificationToDelete) {
      deleteNotificationMutation.mutate(notificationToDelete.id);
    }
  };

  const confirmClearAllNotifications = () => {
    clearAllNotificationsMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      request_received: '📨',
      request_accepted: '✅',
      request_rejected: '❌',
      request_cancelled: '🚫',
      status_update: '🔄',
      message: '💬',
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      request_received: 'bg-blue-50 border-blue-200',
      request_accepted: 'bg-green-50 border-green-200',
      request_rejected: 'bg-red-50 border-red-200',
      request_cancelled: 'bg-red-50 border-red-200',
      status_update: 'bg-yellow-50 border-yellow-200',
      message: 'bg-purple-50 border-purple-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load notifications. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Indicators */}
      {hasAnyUnread && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  You have unread messages
                </h3>
                <p className="text-sm text-blue-700">
                  {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''} in your requests
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {totalUnreadCount}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                {unreadCount} unread
              </span>
            )}
          </div>
          {notifications && notifications.length > 0 && (
            <button
              onClick={handleClearAllNotifications}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Clear All
            </button>
          )}
        </div>

        {notifications && notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5h15A1.5 1.5 0 0121 6v12a1.5 1.5 0 01-1.5 1.5h-15z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You'll receive notifications about your requests here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications?.map((notification: Notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-colors ${
                  notification.is_read
                    ? 'bg-white border-gray-200'
                    : `${getNotificationColor(notification.type)} border-l-4`
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                          title="Delete notification"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    
                    {notification.related_request && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Request #{notification.related_request}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Notification Confirmation Dialog */}
      {showDeleteDialog && notificationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Notification</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setNotificationToDelete(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={deleteNotificationMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNotification}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={deleteNotificationMutation.isLoading}
              >
                {deleteNotificationMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Notifications Confirmation Dialog */}
      {showClearAllDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear All Notifications</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete all notifications? This action cannot be undone and will permanently remove all notification history.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearAllDialog(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={clearAllNotificationsMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAllNotifications}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={clearAllNotificationsMutation.isLoading}
              >
                {clearAllNotificationsMutation.isLoading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
