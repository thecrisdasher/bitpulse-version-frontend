import { prisma } from '@/lib/db'

export class NotificationService {
  static async create(userId: string, title: string, body: string, link: string) {
    return prisma.notification.create({ data: { userId, title, body, link } })
  }

  static async getUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } })
  }
} 