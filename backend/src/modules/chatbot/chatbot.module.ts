import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotService } from './chatbot.service';
import { NaturalLanguageQueryService } from './natural-language-query.service';
import { ChatbotController } from './chatbot.controller';
import { Incident, IncidentSchema } from '../../common/schemas/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]),
  ],
  providers: [ChatbotService, NaturalLanguageQueryService],
  controllers: [ChatbotController],
  exports: [ChatbotService, NaturalLanguageQueryService],
})
export class ChatbotModule {}
