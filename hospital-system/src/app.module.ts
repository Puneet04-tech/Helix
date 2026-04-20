import { Module } from '@nestjs/common';
import { PatientMonitoringService } from './modules/monitoring/patient-monitoring.service';
import { EquipmentMonitoringService } from './modules/monitoring/equipment-monitoring.service';
import { HelixService } from './services/helix.service';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [IncidentsModule, HealthModule],
  providers: [HelixService, PatientMonitoringService, EquipmentMonitoringService],
  exports: [HelixService, PatientMonitoringService, EquipmentMonitoringService],
})
export class AppModule {}
