import { Controller, Post, Body, UseGuards, Req, Get, Param, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { NaturalLanguageQueryService } from './natural-language-query.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private chatbotService: ChatbotService,
    private nlQueryService: NaturalLanguageQueryService,
  ) {}

  /**
   * Feature 2: Natural Language Incident Querying
   * Stream-based query response with Server-Sent Events
   */
  @UseGuards(JwtAuthGuard)
  @Post('query')
  async query(
    @Body() body: { message: string; projectId?: string },
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const projectId = body.projectId || req.user?.projectIds?.[0] || 'default-project';
      
      if (!body.message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Set SSE headers for streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial message
      res.write('data: {"status": "processing", "message": "Analyzing your question..."}\n\n');

      // Get the response from NLP service
      const answer = await this.nlQueryService.queryIncidents(projectId, body.message);

      // Send response with word-by-word effect
      const words = answer.split(' ');
      let delay = 30; // milliseconds between words

      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delay));
        
        res.write(
          `data: ${JSON.stringify({
            type: 'text',
            word: words[i],
            index: i,
            total: words.length,
          })}\n\n`,
        );
      }

      // Send completion
      res.write(`data: ${JSON.stringify({ type: 'complete', answer, timestamp: new Date() })}\n\n`);
      res.end();
    } catch (error) {
      const err = error as Error;
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Get incident insights summary
   */
  @UseGuards(JwtAuthGuard)
  @Get('insights')
  async getInsights(@Req() req: any) {
    try {
      const projectId = req.user?.projectIds?.[0] || 'default-project';

      const response = await this.nlQueryService.queryIncidents(
        projectId,
        'Provide a brief summary of recent incidents and any important patterns.',
      );

      return { insights: response, timestamp: new Date() };
    } catch (error) {
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
