import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards, Req, Headers, Res, HttpException, HttpStatus, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CorrelationService } from './correlation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PostmortemPDFService } from '../postmortem/postmortem-pdf.service';
import { Response } from 'express';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private incidentsService: IncidentsService,
    private correlationService: CorrelationService,
    private postmortemService: PostmortemPDFService,
  ) {}

  @Get('project/:projectId/stats')
  async getDashboardStats(@Param('projectId') projectId: string) {
    const active = await this.incidentsService.getActiveIncidents(projectId);
    const resolved = await this.incidentsService.getResolvedIncidents(projectId, 100);
    
    // Calculate average resolution time
    const resolutionTimes = resolved
      .map(i => (i as any).resolutionTime || 0)
      .filter(t => t > 0);
    
    const avgResolutionMs = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;
    
    const minutes = Math.floor(avgResolutionMs / 1000 / 60);
    const seconds = Math.floor((avgResolutionMs / 1000) % 60);
    
    return {
      activeCount: active.length,
      resolvedCount: resolved.length,
      avgResolutionTime: `${minutes}m ${seconds}s`,
      systemUptime: '99.97%',
    };
  }

  @Get('project/:projectId')
  async getIncidents(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.incidentsService.getIncidentsByProjectId(projectId, l, o);
  }

  @Get()
  async getAllIncidents(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // Public endpoint for demo - returns all incidents regardless of project
    const l = limit ? parseInt(limit, 10) : 100;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.incidentsService.getAllIncidents(l, o);
  }

  @Get('project/:projectId/active')
  async getActiveIncidents(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.incidentsService.getActiveIncidents(projectId, l, o);
  }

  @Get('project/:projectId/resolved')
  async getResolvedIncidents(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 20;
    const o = offset ? parseInt(offset, 10) : 0;
    return this.incidentsService.getResolvedIncidents(projectId, l, o);
  }

  @Get('project/:projectId/count')
  async getIncidentsCount(@Param('projectId') projectId: string) {
    return { count: await this.incidentsService.countIncidentsByProjectId(projectId) };
  }

  @Get('count')
  async getAllIncidentsCount() {
    return { count: await this.incidentsService.countAllIncidents() };
  }

  @Get(':incidentId')
  async getIncident(@Param('incidentId') incidentId: string) {
    return this.incidentsService.getIncidentDetail(incidentId);
  }

  @Put(':incidentId/status')
  async updateStatus(
    @Param('incidentId') incidentId: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.incidentsService.updateIncidentStatus(incidentId, body.status, {
      notes: body.notes,
    });
  }

  @Post(':incidentId/analyze')
  async triggerAnalysis(@Param('incidentId') incidentId: string) {
    try {
      return await this.incidentsService.runAnalysisForIncident(incidentId);
    } catch (error) {
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':incidentId/postmortem/generate')
  async generatePostmortem(@Param('incidentId') incidentId: string) {
    try {
      return await this.incidentsService.generatePostmortemForIncident(incidentId);
    } catch (error) {
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('create')
  async createIncidentDirect(
    @Body() body: {
      projectId?: string;
      title: string;
      description: string;
      severity: string;
      type: string;
      service: string;
    },
    @Headers('x-api-key') apiKey?: string,
  ) {
    const projectId = body.projectId || 'hotel-org-001';
    return this.incidentsService.createIncident(projectId, {
      title: body.title,
      description: body.description,
      severity: body.severity,
      type: body.type,
      service: body.service,
    });
  }

  /**
   * Feature 4: Postmortem PDF Download
   * GET /incidents/:incidentId/postmortem/download
   */
  @UseGuards(JwtAuthGuard)
  @Get(':incidentId/postmortem/download')
  async downloadPostmortem(
    @Param('incidentId') incidentId: string,
    @Res() res: Response,
  ) {
    try {
      const incident = await this.incidentsService.getIncidentDetail(incidentId);
      
      if (!incident) {
        throw new HttpException('Incident not found', HttpStatus.NOT_FOUND);
      }

      if (!incident.postmortemPath) {
        throw new HttpException('Postmortem not available for this incident', HttpStatus.NOT_FOUND);
      }

      const pdfBuffer = this.postmortemService.readPostmortemFile(incident.postmortemPath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="postmortem-${incidentId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      // Preserve 404 (not found / not available) instead of masking it as 500.
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Feature 7: Get Correlated Incidents
   * GET /incidents/correlations/groups
   */
  @UseGuards(JwtAuthGuard)
  @Get('correlations/groups')
  async getCorrelatedIncidents(@Req() req: any) {
    try {
      const projectId = req.user?.projectIds?.[0] || 'default-project';
      const groups = await this.correlationService.getProjectCorrelations(projectId);
      return { projectId, groups };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // DELETE endpoint for risk cleanup
  @Delete('cleanup/:type')
  async deleteByType(@Param('type') type: string) {
    return this.incidentsService.deleteByType(type);
  }

  @Delete(':incidentId')
  async deleteIncident(@Param('incidentId') incidentId: string) {
    return this.incidentsService.deleteIncident(incidentId);
  }
}
