import { Module } from '@nestjs/common';
import { AgentLLMService } from './services/agent-llm.service';

@Module({
  providers: [AgentLLMService],
  exports: [AgentLLMService],
})
export class LlmModule {}
