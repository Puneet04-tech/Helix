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
      clientData.organizationId || 'default',
      clientData.name,
      clientData.monitoredServices || [],
    );
  }

  // Protected endpoint for dashboard
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllClients() {
    return this.clientsService.getClientByOrganizationId('default');
  }
}
