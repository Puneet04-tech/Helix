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
      const severity = equipment.status === 'error' ? 'critical' : 'high';

      console.log(`⚠️ Equipment issues for ${equipment.name}:`, issues);

      // Send to Helix
      await this.helixService.sendEvent({
        type: 'EQUIPMENT_MALFUNCTION',
        severity: severity as any,
        service: `Medical Equipment: ${equipment.type}`,
        message: `${equipment.name} (${equipment.location}): ${issues.join(', ')}`,
        context: {
          equipmentId: equipment.equipmentId,
          name: equipment.name,
          type: equipment.type,
          location: equipment.location,
          issues,
          status: equipment.status,
        },
      });
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
    console.log(`🔍 Monitoring ${equipmentList.length} devices...`);

    for (const equipment of equipmentList) {
      await this.checkEquipmentHealth(equipment);
    }
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
