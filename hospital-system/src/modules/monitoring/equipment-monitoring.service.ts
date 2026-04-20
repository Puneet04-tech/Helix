// hospital-system/src/modules/monitoring/equipment-monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HelixService } from '../../services/helix.service';

interface EquipmentStatus {
  equipmentId: string;
  name: string;
  type: string;
  location: string;
  status: 'operational' | 'warning' | 'error';
  cpuUsage?: number;
  temperature?: number;
  errorCount?: number;
  lastCheck: Date;
}

@Injectable()
export class EquipmentMonitoringService {
  private logger = new Logger('EquipmentMonitoringService');

  constructor(private helixService: HelixService) {}

  /**
   * Check equipment health and send alerts
   */
  async checkEquipmentHealth(equipment: EquipmentStatus): Promise<void> {
    const issues = this.detectIssues(equipment);

    if (issues.length > 0) {
      const severity = equipment.status === 'error' ? 'high' : 'medium';
      const issuesList = issues.join(' | ');

      this.logger.warn(`⚠️ Equipment issues for ${equipment.name}: ${issuesList}`);

      // Use Helix SDK tracking for equipment malfunctions
      this.helixService.trackEquipmentMalfunction(
        equipment.equipmentId,
        equipment.type,
        issuesList,
        severity as 'low' | 'medium' | 'high'
      );

      // If critical, track as crisis prediction
      if (equipment.status === 'error') {
        this.helixService.trackCrisisPrediction(
          `Critical equipment malfunction: ${equipment.name} at ${equipment.location}`,
          'high'
        );
      }

      // Track status update
      const mappedStatus = equipment.status === 'error' ? 'down' : equipment.status === 'warning' ? 'degraded' : 'operational';
      this.helixService.trackStatusUpdate([
        {
          name: equipment.name,
          status: mappedStatus,
        },
      ]);
    }
  }

  /**
   * Detect equipment issues
   */
  private detectIssues(equipment: EquipmentStatus): string[] {
    const issues = [];

    if (equipment.status === 'error') {
      issues.push('Equipment in ERROR state');
    }

    if (equipment.cpuUsage !== undefined && equipment.cpuUsage > 90) {
      issues.push(`High CPU usage: ${equipment.cpuUsage}%`);
    }

    if (equipment.temperature !== undefined && equipment.temperature > 50) {
      issues.push(`Overheating: ${equipment.temperature}°C`);
    }

    if (equipment.errorCount !== undefined && equipment.errorCount > 10) {
      issues.push(`Multiple errors detected: ${equipment.errorCount}`);
    }

    return issues;
  }

  /**
   * Monitor all equipment
   */
  async monitorAllEquipment(equipmentList: EquipmentStatus[]): Promise<void> {
    this.logger.log(`🔍 Monitoring ${equipmentList.length} devices...`);

    for (const equipment of equipmentList) {
      await this.checkEquipmentHealth(equipment);
    }

    // Track overall status
    const operationalCount = equipmentList.filter(e => e.status === 'operational').length;
    const warningCount = equipmentList.filter(e => e.status === 'warning').length;
    const errorCount = equipmentList.filter(e => e.status === 'error').length;

    this.helixService.trackStatusUpdate([
      { name: 'Equipment Operational', status: operationalCount > 0 ? 'operational' : 'down' },
      { name: 'Equipment Warnings', status: warningCount > 0 ? 'degraded' : 'operational' },
      { name: 'Equipment Errors', status: errorCount > 0 ? 'down' : 'operational' },
    ]);
  }

  /**
   * Get equipment status summary
   */
  async getEquipmentSummary(): Promise<any> {
    return {
      totalEquipment: 0,
      operational: 0,
      warning: 0,
      error: 0,
    };
  }
}
