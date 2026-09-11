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
        // Try to install browsers if not present
        const { exec } = require('child_process');
        await new Promise<void>((resolve, reject) => {
          exec('npx playwright install chromium --with-deps', (error: any) => {
            if (error) {
              this.logger.warn(`Playwright install warning: ${error.message}`);
            }
            resolve();
          });
        });

        this.browser = await chromium.launch({
          headless: true,
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-software-rasterizer',
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
    this.logger.log(`[PLAYWRIGHT] Executing action: ${action} on ${targetUrl}`);
    try {
      await this.initBrowser();
      const context = await this.browser!.newContext();
      const page = await context.newPage();

      const handler: { [key: string]: (p: Page, t: string, a?: any) => Promise<ActionResult> } = {
        restart_service: this.handleRestartService,
        scale_up: this.handleScaleUp,
        clear_cache: this.handleClearCache,
        failover: this.handleFailover,
        kill_process: this.handleKillProcess,
      };

      const fn = handler[action];
      if (!fn) {
        await context.close();
        return {
          success: false,
          action,
          result: 'Unknown action - no browser handler registered',
          timestamp: Date.now(),
        };
      }

      try {
        return await fn.call(this, page, targetUrl, parameters);
      } finally {
        await context.close();
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[PLAYWRIGHT] Browser execution failed for ${action}: ${err.message}`);
      return {
        success: false,
        action,
        result: `Playwright did not run: ${err.message}. Install browsers with npx playwright install chromium (Render also needs --no-sandbox).`,
        timestamp: Date.now(),
      };
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
