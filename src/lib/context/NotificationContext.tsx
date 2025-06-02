'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'profile_update' | 'new_registration' | 'session_expiry' | 'payment_received';
  message: string;
  timestamp: string;
  read: boolean;
  details?: {
    updatedFields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: Notification['type'], message: string, details?: Notification['details']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    console.log('Loading notifications from localStorage');
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        console.log('Loaded notifications:', parsedNotifications);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Error parsing notifications:', error);
        localStorage.removeItem('notifications');
      }
    }
  }, []);

  // Update unread count and save to localStorage when notifications change
  useEffect(() => {
    console.log('Notifications state changed:', notifications);
    const unread = notifications.filter(n => !n.read).length;
    console.log('Calculated unread count:', unread);
    setUnreadCount(unread);
    console.log('Saving notifications to localStorage:', notifications);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (type: Notification['type'], message: string, details?: Notification['details']) => {
    console.log('Adding new notification:', { type, message, details });
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      details
    };

    console.log('Created notification object:', newNotification);

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      console.log('Updated notifications array:', updated);
      return updated;
    });

    // Remove toast.info since we're already showing a success toast
    // toast.info(message);
  };

  const markAsRead = (id: string) => {
    console.log('Marking notification as read:', id);
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      console.log('Updated notifications after marking as read:', updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    console.log('Marking all notifications as read');
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }));
      console.log('Updated notifications after marking all as read:', updated);
      return updated;
    });
  };

  const clearNotifications = () => {
    console.log('Clearing all notifications');
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 