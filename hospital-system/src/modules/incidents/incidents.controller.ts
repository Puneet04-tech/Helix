import { Controller, Post, Get, Body } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  async create(@Body() createIncidentDto: any) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  async findAll() {
    return this.incidentsService.findAll();
  }
}
