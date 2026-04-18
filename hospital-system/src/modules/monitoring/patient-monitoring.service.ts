// hospital-system/src/modules/monitoring/patient-monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HelixService } from '../../services/helix.service';

interface VitalSigns {
  patientId: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenLevel: number;
  temperature: number;
  respiratoryRate: number;
  timestamp: Date;
}

@Injectable()
export class PatientMonitoringService {
  private logger = new Logger('PatientMonitoringService');

  constructor(private helixService: HelixService) {}

  /**
   * Update and monitor patient vitals
   */
  async updateVitals(vitals: VitalSigns): Promise<{ vitals: VitalSigns; anomalies: string[] }> {
    const anomalies = this.detectAnomalies(vitals);

    if (anomalies.length > 0) {
      const severity = anomalies.length >= 3 ? 'high' : 'medium';
      const anomalyList = anomalies.join(' | ');

      this.logger.warn(`⚠️ Anomalies detected for patient ${vitals.patientId}: ${anomalyList}`);

      // Use Helix SDK tracking for patient vital anomalies
      this.helixService.trackPatientVitalAnomaly(
        vitals.patientId,
        this.getAnomalousVital(anomalies),
        anomalyList,
        severity as 'low' | 'medium' | 'high'
      );

      // If critical anomalies, track as crisis prediction
      if (anomalies.length >= 3) {
        this.helixService.trackCrisisPrediction(
          `Multi-vital anomalies for patient ${vitals.patientId}`,
          'high'
        );
      }
    }

    return { vitals, anomalies };
  }

  /**
   * Detect vital sign anomalies
   */
  private detectAnomalies(vitals: VitalSigns): string[] {
    const anomalies = [];

    // Heart Rate: 60-100 normal, 40-60 bradycardia, 100-120 tachycardia, >120 severe
    if (vitals.heartRate > 120) anomalies.push('Tachycardia (HR > 120)');
    if (vitals.heartRate < 40) anomalies.push('Bradycardia (HR < 40)');

    // Blood Pressure: normal <120/80, stage 1 120-139/80-89, stage 2 ≥140/90
    if (vitals.bloodPressureSystolic > 160) anomalies.push('Hypertensive Crisis');
    if (vitals.bloodPressureSystolic < 90) anomalies.push('Hypotension');

    // Oxygen Level: normal >95%, low 90-95%, critical <90%
    if (vitals.oxygenLevel < 90) anomalies.push('Severe Hypoxia (O2 < 90%)');
    if (vitals.oxygenLevel < 93) anomalies.push('Moderate Hypoxia (O2 < 93%)');

    // Temperature: normal 36.5-37.5, fever >38, high fever >39
    if (vitals.temperature > 40) anomalies.push('Severe Fever (>40°C)');
    if (vitals.temperature > 39) anomalies.push('High Fever (>39°C)');
    if (vitals.temperature < 35) anomalies.push('Hypothermia (<35°C)');

    // Respiratory Rate: normal 12-20, tachypnea >20, bradypnea <12
    if (vitals.respiratoryRate > 30) anomalies.push('Tachypnea (RR > 30)');
    if (vitals.respiratoryRate < 10) anomalies.push('Bradypnea (RR < 10)');

    return anomalies;
  }

  /**
   * Get the most critical anomalous vital from the list
   */
  private getAnomalousVital(anomalies: string[]): string {
    if (anomalies.some(a => a.includes('HR'))) return 'heartRate';
    if (anomalies.some(a => a.includes('Blood Pressure'))) return 'bloodPressure';
    if (anomalies.some(a => a.includes('O2'))) return 'oxygenLevel';
    if (anomalies.some(a => a.includes('Fever'))) return 'temperature';
    if (anomalies.some(a => a.includes('Respiratory'))) return 'respiratoryRate';
    return 'unknown';
  }

  /**
   * Get patient monitoring status
   */
  async getPatientStatus(patientId: string): Promise<any> {
    return {
      patientId,
      status: 'monitoring',
      lastUpdate: new Date(),
    };
  }
}
