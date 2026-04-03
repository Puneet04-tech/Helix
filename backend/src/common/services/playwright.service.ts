import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

interface ActionResult {
  success: boolean;
  action: string;
  result: string;
  timestamp: number;
}

@Injectable()
export class PlaywrightService {
  private readonly logger = new Logger(PlaywrightService.name);
  private browser: Browser | null = null;

  async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.logger.debug('Initializing Playwright browser');
      try {
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-first-run',
          ],
        });
        this.logger.debug('Browser initialized successfully');
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Failed to initialize browser: ${err.message}`);
        throw error;
      }
    }
  }

  async executeAction(action: string, targetUrl: string, parameters?: any): Promise<ActionResult> {
    await this.initBrowser();

    let page: Page | null = null;
    try {
      page = await this.browser!.newPage();
      const startTime = Date.now();

      switch (action) {
        case 'restart_service':
          return await this.handleRestartService(page, targetUrl, parameters);
        case 'scale_up':
          return await this.handleScaleUp(page, targetUrl, parameters);
        case 'clear_cache':
          return await this.handleClearCache(page, targetUrl, parameters);
        case 'failover':
          return await this.handleFailover(page, targetUrl, parameters);
        case 'kill_process':
          return await this.handleKillProcess(page, targetUrl, parameters);
        default:
          return {
            success: false,
            action,
            result: 'Unknown action',
            timestamp: Date.now(),
          };
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Playwright action failed: ${action} - ${err.message}`,
      );
      return {
        success: false,
        action,
        result: `Failed: ${err.message}`,
        timestamp: Date.now(),
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async handleRestartService(
    page: Page,
    targetUrl: string,
    parameters: any,
  ): Promise<ActionResult> {
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click('[data-action="restart"]');
      await page.click('[data-confirm="yes"]');
      await page.waitForTimeout(2000);
      return {
        success: true,
        action: 'restart_service',
        result: `Service restarted successfully`,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleScaleUp(
    page: Page,
    targetUrl: string,
    parameters: any,
  ): Promise<ActionResult> {
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click('[data-action="scale"]');
      await page.fill('[data-input="instances"]', parameters?.instances || '2');
      await page.click('[data-confirm="scale"]');
      await page.waitForTimeout(3000);
      return {
        success: true,
        action: 'scale_up',
        result: `Scaled to ${parameters?.instances || 2} instances`,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleClearCache(
    page: Page,
    targetUrl: string,
    parameters: any,
  ): Promise<ActionResult> {
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click('[data-action="cache-clear"]');
      await page.click('[data-confirm="yes"]');
      await page.waitForTimeout(1000);
      return {
        success: true,
        action: 'clear_cache',
        result: 'Cache cleared successfully',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleFailover(
    page: Page,
    targetUrl: string,
    parameters: any,
  ): Promise<ActionResult> {
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click('[data-action="failover"]');
      await page.click('[data-confirm="yes"]');
      await page.waitForTimeout(5000);
      return {
        success: true,
        action: 'failover',
        result: 'Failover completed successfully',
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleKillProcess(
    page: Page,
    targetUrl: string,
    parameters: any,
  ): Promise<ActionResult> {
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.click(`[data-action="kill-${parameters?.processId}"]`);
      await page.click('[data-confirm="yes"]');
      await page.waitForTimeout(1500);
      return {
        success: true,
        action: 'kill_process',
        result: `Process ${parameters?.processId} terminated`,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.debug('Browser closed');
    }
  }
}
