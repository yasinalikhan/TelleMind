import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A2UIActionService } from '../../../core/services/a2ui-action.service';

@Component({
  selector: 'a2ui-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-md backdrop-blur-md flex flex-wrap gap-4 items-center justify-between">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="text-sm font-semibold text-white">{{ props().title || 'Data Filters:' }}</div>
        
        <!-- Region Filter -->
        <div class="flex flex-col gap-1">
          <select #regionSelect (change)="onFilterChange('region', regionSelect.value)" 
                  class="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none">
            <option value="">All Regions</option>
            <option value="Kabul">Kabul</option>
            <option value="Herat">Herat</option>
            <option value="Mazar-e-Sharif">Mazar-e-Sharif</option>
            <option value="Kandahar">Kandahar</option>
            <option value="Jalalabad">Jalalabad</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex flex-col gap-1">
          <select #statusSelect (change)="onFilterChange('status', statusSelect.value)" 
                  class="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      <!-- Action button (e.g. Export) -->
      @if (hasExportEvent()) {
        <button (click)="triggerExport()" 
                class="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-1.5 text-xs flex items-center gap-1.5 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      }
    </div>
  `
})
export class FilterComponent {
  id = input<string>('');
  props = input.required<any>();
  events = input<any[]>([]);

  private actionService = inject(A2UIActionService);

  onFilterChange(field: string, value: string): void {
    const filterEvent = this.events().find(e => e.event === 'change' || e.event === 'filter');
    if (filterEvent && filterEvent.action) {
      // Trigger target data component refresh or filtering
      this.actionService.handleAction(filterEvent.action, JSON.stringify({ field, value }));
    }
  }

  hasExportEvent(): boolean {
    return this.events().some(e => e.action?.type === 'EXPORT_DATA');
  }

  triggerExport(): void {
    const exportEvent = this.events().find(e => e.action?.type === 'EXPORT_DATA');
    if (exportEvent && exportEvent.action) {
      this.actionService.handleAction(exportEvent.action, JSON.stringify(this.props().data));
    }
  }
}
