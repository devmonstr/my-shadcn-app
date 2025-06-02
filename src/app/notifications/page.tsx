'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/context/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '@/components/Navbar';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearNotifications();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
              >
                {filter === 'all' ? 'Show Unread' : 'Show All'}
              </Button>
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={!notifications.some(n => !n.read)}
              >
                Mark All as Read
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No notifications
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className={!notification.read ? 'bg-muted/50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        {notification.details?.updatedFields && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p className="font-medium">Updated fields:</p>
                            <ul className="list-disc list-inside mt-1">
                              {notification.details.updatedFields.map((field, index) => (
                                <li key={index}>
                                  {field}: {notification.details?.oldValues?.[field]} → {notification.details?.newValues?.[field]}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 