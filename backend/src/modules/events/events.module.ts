import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from '../../common/schemas/event.schema';
import { Client, ClientSchema } from '../../common/schemas/client.schema';
import { MemoryService } from '../../common/services/memory.service';
import { HuggingFaceService } from '../../common/services/huggingface.service';
import { OllamaService } from '../../common/services/ollama.service';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    forwardRef(() => IncidentsModule),
  ],
  controllers: [EventsController],
  providers: [EventsService, MemoryService, HuggingFaceService, OllamaService],
  exports: [EventsService, MemoryService, HuggingFaceService, OllamaService],
})
export class EventsModule {}
