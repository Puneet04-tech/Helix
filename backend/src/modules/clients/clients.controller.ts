import { Controller, Get, Post, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  // Public endpoint for SDK - requires API key
  @Post()
  async createClient(@Body() clientData: any) {
    return this.clientsService.createClient(
      clientData.name,
      clientData.apiKey,
      clientData.monitoredServices,
    );
  }

  // Protected endpoint for dashboard
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllClients() {
    return this.clientsService.getAllClients();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getClientById(@Query('id') id: string) {
    return this.clientsService.getClientById(id);
  }
}
