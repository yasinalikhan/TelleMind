import { Injectable, Type } from '@angular/core';
import { KpiComponent } from '../../shared/components/a2ui-kpi/kpi.component';
import { ChartComponent } from '../../shared/components/a2ui-chart/chart.component';
import { TableComponent } from '../../shared/components/a2ui-table/table.component';
import { MapComponent } from '../../shared/components/a2ui-map/map.component';
import { FilterComponent } from '../../shared/components/a2ui-filter/filter.component';

@Injectable({
  providedIn: 'root'
})
export class A2UIRegistryService {
  private registry: Record<string, Type<any>> = {
    'kpi': KpiComponent,
    'chart': ChartComponent,
    'table': TableComponent,
    'map': MapComponent,
    'filter': FilterComponent
  };

  getComponentType(type: string): Type<any> {
    const comp = this.registry[type];
    if (!comp) {
      throw new Error(`Component type '${type}' is not registered in A2UIRegistry.`);
    }
    return comp;
  }
}
