import { Component, input } from '@angular/core';

@Component({
  selector: 'a2ui-kpi',
  standalone: true,
  template: `
    <div class="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/30 hover:shadow-indigo-500/10">
      <!-- Accent Glow -->
      <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl"></div>
      
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-slate-400 uppercase tracking-wider">{{ props().title }}</h3>
        <span class="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a6.002 6.002 0 0 1-10.8 0m10.8 0V12m0 6.75H9.75m10.8 0h3m-13.8 0H1.5m3-6.75h3m-3.75 3h1.5m10.5-3h1.5m-1.5 3h1.5M9 3h.008v.008H9V3Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM12 6h.008v.008H12V6Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-6 0h.008v.008H6V6Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3 9h.008v.008H3V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm12 0h.008v.008H15V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-6 0h.008v.008H9V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-3 0h.008v.008H6V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </span>
      </div>

      <div class="mt-4 flex items-baseline gap-2">
        <span class="text-4xl font-extrabold text-white tracking-tight">
          {{ formatValue(props().value) }}
        </span>
      </div>

      <div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.75 1.5a.75.75 0 0 1 .53.919l-1.5 4.75a.75.75 0 0 1-1.428-.452l.933-2.956-5.15 5.15a.75.75 0 0 1-1.06 0L8 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L7.47 8.47a.75.75 0 0 1 1.06 0l2.94 2.94 4.62-4.62-2.956-.933a.75.75 0 0 1-.53-.919Z" clip-rule="evenodd" />
        </svg>
        <span>+18.7% from pre-scheduled forecast</span>
      </div>
    </div>
  `
})
export class KpiComponent {
  id = input<string>('');
  props = input.required<any>();
  events = input<any[]>([]);

  formatValue(val: any): string {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return '$' + (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return '$' + val.toLocaleString();
      }
      return '$' + val.toString();
    }
    return String(val);
  }
}
