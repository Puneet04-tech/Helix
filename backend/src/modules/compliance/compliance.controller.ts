import { Controller, Get, UseGuards, Req, Res, HttpException, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ComplianceReportService } from './compliance-report.service';
import { Response } from 'express';

@Controller('compliance')
export class ComplianceController {
  constructor(private complianceService: ComplianceReportService) {}

  /**
   * Feature 8: Download Compliance Report
   * GET /compliance/report?startDate=2024-01-01&endDate=2024-12-31
   * Requires authentication
   */
  @UseGuards(JwtAuthGuard)
  @Get('report')
  async downloadComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const projectId = req.user?.projectId;

      if (!projectId) {
        throw new HttpException('Project ID not found in token', HttpStatus.UNAUTHORIZED);
      }

      if (!startDate || !endDate) {
        throw new HttpException('startDate and endDate are required (YYYY-MM-DD format)', HttpStatus.BAD_REQUEST);
      }

      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new HttpException('Invalid date format. Use YYYY-MM-DD', HttpStatus.BAD_REQUEST);
      }

      // Generate PDF
      const pdfBuffer = await this.complianceService.downloadComplianceReport(
        projectId,
        start,
        end,
      );

      // Send as downloadable PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="compliance-report-${startDate}-to-${endDate}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get compliance report metadata (without download)
   */
  @UseGuards(JwtAuthGuard)
  @Get('report/info')
  async getComplianceReportInfo(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    try {
      const projectId = req.user?.projectId;

      if (!projectId) {
        throw new HttpException('Project ID not found in token', HttpStatus.UNAUTHORIZED);
      }

      return {
        projectId,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        reportType: 'Compliance Incident Log',
        certification: 'Suitable for SOC 2, ISO 27001, and regulatory compliance review',
        generatedAt: new Date(),
      };
    } catch (error) {
      const err = error as Error;
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
