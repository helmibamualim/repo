import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { IpLog } from './entities/ip-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(IpLog)
    private ipLogRepository: Repository<IpLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Activity Logging
  async logActivity(
    userId: string | null,
    activityType: string,
    description: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
    tableId?: string,
  ) {
    const activityLog = this.activityLogRepository.create({
      userId,
      activityType,
      description,
      metadata,
      ipAddress,
      userAgent,
      tableId,
    });

    return await this.activityLogRepository.save(activityLog);
  }

  // IP Tracking
  async trackUserIP(
    userId: string,
    ipAddress: string,
    userAgent: string,
    locationData?: {
      country?: string;
      city?: string;
      region?: string;
      timezone?: string;
      isp?: string;
    },
    deviceInfo?: {
      deviceType?: string;
      browser?: string;
      os?: string;
    },
  ) {
    // Check if IP already exists for this user
    const existingIpLog = await this.ipLogRepository.findOne({
      where: { userId, ipAddress },
    });

    if (existingIpLog) {
      // Update existing record
      await this.ipLogRepository.update(
        { userId, ipAddress },
        {
          lastSeen: new Date(),
          loginCount: () => 'login_count + 1',
          userAgent,
          ...deviceInfo,
        },
      );
      return existingIpLog;
    } else {
      // Create new IP log
      const ipLog = this.ipLogRepository.create({
        userId,
        ipAddress,
        userAgent,
        firstSeen: new Date(),
        lastSeen: new Date(),
        loginCount: 1,
        ...locationData,
        ...deviceInfo,
      });

      return await this.ipLogRepository.save(ipLog);
    }
  }

  // Get user activity logs
  async getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 20,
    activityType?: string,
  ) {
    const whereCondition: any = { userId };
    if (activityType) {
      whereCondition.activityType = activityType;
    }

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get user IP history
  async getUserIPHistory(userId: string) {
    return await this.ipLogRepository.find({
      where: { userId },
      order: { lastSeen: 'DESC' },
    });
  }

  // Detect suspicious activity
  async detectSuspiciousActivity(userId: string) {
    const suspiciousActivities = [];

    // Check for multiple IPs
    const ipCount = await this.ipLogRepository.count({
      where: { userId },
    });

    if (ipCount > 5) {
      suspiciousActivities.push({
        type: 'multiple_ips',
        severity: 'medium',
        description: `User has logged in from ${ipCount} different IP addresses`,
      });
    }

    // Check for rapid login attempts
    const recentLogins = await this.activityLogRepository.count({
      where: {
        userId,
        activityType: 'login',
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    });

    if (recentLogins > 10) {
      suspiciousActivities.push({
        type: 'rapid_logins',
        severity: 'high',
        description: `${recentLogins} login attempts in the last hour`,
      });
    }

    // Check for unusual activity patterns
    const recentActivities = await this.activityLogRepository.find({
      where: {
        userId,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const activityTypes = recentActivities.map(log => log.activityType);
    const uniqueActivityTypes = [...new Set(activityTypes)];

    if (uniqueActivityTypes.length > 20) {
      suspiciousActivities.push({
        type: 'unusual_activity_pattern',
        severity: 'medium',
        description: `${uniqueActivityTypes.length} different activity types in 24 hours`,
      });
    }

    return suspiciousActivities;
  }

  // Check for users from same IP
  async getUsersFromSameIP(ipAddress: string) {
    const ipLogs = await this.ipLogRepository.find({
      where: { ipAddress },
      relations: ['user'],
      order: { lastSeen: 'DESC' },
    });

    return ipLogs.map(log => ({
      userId: log.userId,
      username: log.user?.username,
      lastSeen: log.lastSeen,
      loginCount: log.loginCount,
    }));
  }

  // Analytics Dashboard Data
  async getAnalyticsDashboard() {
    const totalUsers = await this.userRepository.count();
    const activeUsersToday = await this.userRepository.count({
      where: {
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const totalActivities = await this.activityLogRepository.count();
    const activitiesToday = await this.activityLogRepository.count({
      where: {
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const uniqueIPsToday = await this.ipLogRepository
      .createQueryBuilder('ip_log')
      .select('COUNT(DISTINCT ip_log.ipAddress)', 'count')
      .where('ip_log.lastSeen >= :today', {
        today: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    // Top activity types
    const topActivityTypes = await this.activityLogRepository
      .createQueryBuilder('activity_log')
      .select('activity_log.activityType', 'activityType')
      .addSelect('COUNT(*)', 'count')
      .where('activity_log.createdAt >= :today', {
        today: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .groupBy('activity_log.activityType')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Top countries
    const topCountries = await this.ipLogRepository
      .createQueryBuilder('ip_log')
      .select('ip_log.country', 'country')
      .addSelect('COUNT(DISTINCT ip_log.userId)', 'userCount')
      .where('ip_log.country IS NOT NULL')
      .groupBy('ip_log.country')
      .orderBy('userCount', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalUsers,
      activeUsersToday,
      totalActivities,
      activitiesToday,
      uniqueIPsToday: uniqueIPsToday?.count || 0,
      topActivityTypes,
      topCountries,
    };
  }

  // Get activity trends
  async getActivityTrends(days: number = 7) {
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayActivities = await this.activityLogRepository.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          } as any,
        },
      });

      const dayLogins = await this.activityLogRepository.count({
        where: {
          activityType: 'login',
          createdAt: {
            gte: date,
            lt: nextDate,
          } as any,
        },
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        totalActivities: dayActivities,
        logins: dayLogins,
      });
    }

    return trends;
  }

  // Security monitoring
  async getSecurityAlerts() {
    const alerts = [];

    // Check for multiple accounts from same IP
    const suspiciousIPs = await this.ipLogRepository
      .createQueryBuilder('ip_log')
      .select('ip_log.ipAddress', 'ipAddress')
      .addSelect('COUNT(DISTINCT ip_log.userId)', 'userCount')
      .groupBy('ip_log.ipAddress')
      .having('COUNT(DISTINCT ip_log.userId) > :threshold', { threshold: 3 })
      .getRawMany();

    for (const ip of suspiciousIPs) {
      alerts.push({
        type: 'multiple_accounts_same_ip',
        severity: 'high',
        message: `${ip.userCount} accounts detected from IP ${ip.ipAddress}`,
        ipAddress: ip.ipAddress,
      });
    }

    // Check for rapid activity patterns
    const rapidActivities = await this.activityLogRepository
      .createQueryBuilder('activity_log')
      .select('activity_log.userId', 'userId')
      .addSelect('COUNT(*)', 'activityCount')
      .where('activity_log.createdAt >= :oneHourAgo', {
        oneHourAgo: new Date(Date.now() - 60 * 60 * 1000),
      })
      .groupBy('activity_log.userId')
      .having('COUNT(*) > :threshold', { threshold: 50 })
      .getRawMany();

    for (const activity of rapidActivities) {
      alerts.push({
        type: 'rapid_activity',
        severity: 'medium',
        message: `User ${activity.userId} has ${activity.activityCount} activities in the last hour`,
        userId: activity.userId,
      });
    }

    return alerts;
  }
}
