import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditService } from '../../common/services/audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  async getAuditTrail(
    @Request() req: any,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    const projectId = req.user?.projectIds?.[0];
    const { logs, total } = await this.auditService.getAuditTrail(
      projectId,
      parseInt(limit),
      parseInt(offset),
    );

    return {
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  }

  @Get('incident/:incidentId')
  async getIncidentAuditTrail(
    @Request() req: any,
    @Param('incidentId') incidentId: string,
  ) {
    const logs = await this.auditService.getIncidentAuditTrail(incidentId);
    return logs;
  }
}
