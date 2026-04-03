import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Client, ClientDocument } from '../../common/schemas/client.schema';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async createClient(
    organizationId: string,
    name: string,
    services: string[],
  ) {
    const apiKey = this.generateApiKey();

    const client = new this.clientModel({
      organizationId,
      name,
      apiKey,
      monitoredServices: services,
      status: 'active',
      userIds: [],
    });

    await client.save();
    this.logger.debug(`Client created: ${name}`);

    return {
      clientId: client._id,
      name: client.name,
      apiKey,
      services: client.monitoredServices,
    };
  }

  async getClientByOrganizationId(organizationId: string) {
    return this.clientModel
      .find({ organizationId })
      .select('-apiKey')
      .lean();
  }

  async getClientByApiKey(apiKey: string) {
    return this.clientModel.findOne({ apiKey });
  }

  async updateClientSettings(clientId: string, settings: any) {
    return this.clientModel.findByIdAndUpdate(
      clientId,
      { settings },
      { new: true },
    );
  }

  async updateStatusSummary(clientId: string, statusSummary: any) {
    return this.clientModel.findByIdAndUpdate(
      clientId,
      { statusSummary },
      { new: true },
    );
  }

  private generateApiKey(): string {
    return `ag_${uuid()}`;
  }
}
