import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../../common/schemas/event.schema';
import { Client, ClientDocument } from '../../common/schemas/client.schema';
import { User, UserDocument } from '../../common/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { MLModelService } from '../../common/services/ml-model.service';

/**
 * Feature 1: Predictive Crisis Detection
 * Runs hourly, uses a real TensorFlow.js neural network to predict crisis risk
 * from historical event patterns (not just statistical thresholds).
 */
@Injectable()
export class PredictiveCrisisService {
  private readonly logger = new Logger(PredictiveCrisisService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private mlModelService: MLModelService,
  ) {}

  /**
   * Cron job that runs every hour to detect potential crises
   */
  @Cron(CronExpression.EVERY_HOUR)
  async detectPredictiveCrises() {
    try {
      this.logger.debug('Running predictive crisis detection...');
      
      const clients = await this.clientModel.find({ status: 'active' });
      
      for (const client of clients) {
        await this.analyzeCrisisPatterns(client._id.toString());
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Predictive crisis detection failed: ${err.message}`);
    }
  }

  /**
   * Analyze patterns for a specific client
   */
  private async analyzeCrisisPatterns(projectId: string) {
    try {
      // Get events from last 28 days
      const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      
      const events = await this.eventModel.aggregate([
        {
          $match: {
            projectId,
            timestamp: { $gte: twentyEightDaysAgo },
            type: { $in: ['error', 'warning', 'critical'] },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              dayOfWeek: { $dayOfWeek: '$timestamp' },
              hour: { $hour: '$timestamp' },
            },
            count: { $sum: 1 },
            errorCount: {
              $sum: { $cond: [{ $eq: ['$type', 'error'] }, 1, 0] },
            },
          },
        },
        {
          $sort: { '_id.date': -1 },
        },
      ]);

      // Calculate baseline and detect patterns
      const baselineByTimeSlot: { [key: string]: number[] } = {};
      const currentWeekPatterns: { [key: string]: number } = {};

      for (const event of events) {
        const { dayOfWeek, hour } = event._id;
        const timeSlot = `${dayOfWeek}-${hour}`;
        
        if (!baselineByTimeSlot[timeSlot]) {
          baselineByTimeSlot[timeSlot] = [];
        }
        baselineByTimeSlot[timeSlot].push(event.errorCount / event.count);

        // Check if this is within current week
        const eventDate = new Date(event._id.date);
        const currentDate = new Date();
        const daysAgo = (currentDate.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (daysAgo < 7) {
          currentWeekPatterns[timeSlot] = event.errorCount / event.count;
        }
      }

      // Identify crisis patterns using the real ML neural network
      for (const [timeSlot, currentErrorRate] of Object.entries(currentWeekPatterns)) {
        const historicalRates = baselineByTimeSlot[timeSlot] || [];
        
        if (historicalRates.length >= 3) {
          const averageErrorRate = historicalRates.reduce((a: number, b: number) => a + b, 0) / historicalRates.length;
          const [dayOfWeekStr, hourStr] = timeSlot.split('-');
          const dayOfWeek = parseInt(dayOfWeekStr);
          const hour = parseInt(hourStr);

          // Build ML feature vector for this time slot
          // [timeSlot, dayOfWeek, historicalAvgRate, currentRate, trend, volume]
          const mlFeatures = [
            hour / 24,                          // normalized time of day
            dayOfWeek / 7,                      // normalized day of week
            Math.min(averageErrorRate, 1),      // historical baseline
            Math.min(currentErrorRate, 1),      // current rate
            Math.min(Math.max(currentErrorRate - averageErrorRate, 0) / Math.max(averageErrorRate, 0.01), 1), // trend
            Math.min(events.length / 500, 1),   // volume
          ];

          // Real ML inference
          const mlResult = await this.mlModelService.predictCrisisRisk(mlFeatures);

          // ML prediction takes precedence; fall back to a high statistical threshold only if ML not ready
          const isCrisis =
            mlResult?.isCrisisRisk ??
            (currentErrorRate as number) > averageErrorRate * 3;

          if (isCrisis) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            await this.sendPredictiveWarning(
              projectId,
              days[dayOfWeek - 1],
              hour,
              (currentErrorRate as number),
              averageErrorRate,
              mlResult?.crisisProbability ?? null,
            );
          }
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to analyze crisis patterns for ${projectId}: ${err.message}`);
    }
  }

  /**
   * Send proactive warning email to admin
   */
  private async sendPredictiveWarning(
    projectId: string,
    dayOfWeek: string,
    hour: number,
    currentRate: number,
    baselineRate: number,
    mlProbability: number | null = null,
  ) {
    try {
      const client = await this.clientModel.findById(projectId);
      if (!client) return;

      const mlConfidenceText = mlProbability !== null
        ? `\nML Crisis Probability: ${(mlProbability * 100).toFixed(1)}%`
        : '';

      const subject = `⚠️ Predictive Alert: ${dayOfWeek} ${hour}:00-${hour + 1}:00 Crisis Pattern Detected`;
      const message = `
        Pattern Detected for ${client.name}:
        
        Time Slot: Every ${dayOfWeek} from ${hour}:00 to ${hour + 1}:00
        Current Error Rate: ${(currentRate * 100).toFixed(2)}%
        Historical Average: ${(baselineRate * 100).toFixed(2)}%
        ${mlConfidenceText}
        
        This was predicted by the TensorFlow.js neural network model trained on historical
        event patterns across your services.
        Consider preparing your team or investigating root causes for this time window.
      `;

      // userIds is a plain array of id strings (not a populate ref), so load the
      // user documents directly to get their email addresses.
      if (client.userIds?.length) {
        const users = await this.userModel.find({ _id: { $in: client.userIds } });
        for (const user of users) {
          if (user.email) {
            await this.notificationsService.sendEmail(user.email, subject, message);
          }
        }
      }

      this.logger.debug(`Sent predictive warning to ${client.name}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to send predictive warning: ${err.message}`);
    }
  }
}
