// Notification Service for StudyAI
// Handles browser notifications with permission management

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    this.permission = Notification.permission;
    return this.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission;
  }

  async showNotification(title: string, options?: NotificationOptions) {
    const permission = await this.checkPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });

    return notification;
  }

  // Study Reminder Notification
  async sendStudyReminder(title: string, time: string) {
    return this.showNotification('📚 Study Reminder', {
      body: `Your study session "${title}" starts at ${time}`,
      tag: 'study-reminder',
      requireInteraction: false,
    });
  }

  // Task Deadline Alert
  async sendDeadlineAlert(taskTitle: string, timeRemaining: string) {
    return this.showNotification('⏰ Deadline Alert', {
      body: `Task "${taskTitle}" is due ${timeRemaining}`,
      tag: 'deadline-alert',
      requireInteraction: true,
    });
  }

  // Achievement Notification
  async sendAchievementNotification(title: string, description: string, icon: string = '🏆') {
    return this.showNotification(`${icon} Achievement Unlocked!`, {
      body: `${title}\n${description}`,
      tag: 'achievement',
      requireInteraction: true,
    });
  }

  // Test notification
  async sendTestNotification(type: 'study' | 'deadline' | 'achievement') {
    switch (type) {
      case 'study':
        return this.sendStudyReminder('Advanced Mathematics', '2:00 PM');
      case 'deadline':
        return this.sendDeadlineAlert('Complete Assignment', 'in 1 hour');
      case 'achievement':
        return this.sendAchievementNotification(
          'First Task Complete!',
          'You completed your first task. Great start!',
          '✅'
        );
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = NotificationService.getInstance();
