import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);

  success(message: string, duration = 3000): void {
    this.addNotification({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this.addNotification({ type: 'error', message, duration });
  }

  warning(message: string, duration = 4000): void {
    this.addNotification({ type: 'warning', message, duration });
  }

  info(message: string, duration = 3000): void {
    this.addNotification({ type: 'info', message, duration });
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const id = Math.random().toString(36).substr(2, 9);
    const fullNotification: Notification = { ...notification, id };

    this.notifications.update((notifs) => [...notifs, fullNotification]);

    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }
  }

  removeNotification(id: string): void {
    this.notifications.update((notifs) => notifs.filter((n) => n.id !== id));
  }

  clearAll(): void {
    this.notifications.set([]);
  }
}
