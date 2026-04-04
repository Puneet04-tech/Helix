import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @UseGuards(JwtAuthGuard)
  @Post('query')
  async query(
    @Body() body: { message: string; projectId?: string },
    @Req() req: any,
  ) {
    const projectId = body.projectId || 'default-project';
    const response = await this.chatbotService.queryIncidents(
      projectId,
      body.message,
    );

    return {
      response,
      timestamp: new Date(),
    };
  }
}
