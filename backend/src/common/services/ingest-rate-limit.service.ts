import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class IngestRateLimitService {
  private readonly logger = new Logger(IngestRateLimitService.name);
  private readonly buckets = new Map<string, RateLimitEntry>();
  private readonly windowMs = 60_000;
  private readonly maxRequests = 120;

  check(key: string): void {
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || now >= entry.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    entry.count += 1;
    if (entry.count > this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for key: ${key.substring(0, 8)}...`);
      throw new HttpException('Rate limit exceeded. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
