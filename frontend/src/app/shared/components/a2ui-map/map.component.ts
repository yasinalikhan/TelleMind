import { Component, input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A2UIActionService } from '../../../core/services/a2ui-action.service';

@Component({
  selector: 'a2ui-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ props().title }}</h3>
          <p class="text-xs text-slate-400">Pulsing indicators scale based on live network weights. Click region for details.</p>
        </div>
        <div class="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 animate-pulse">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Live Feeds Active
        </div>
      </div>

      <!-- Map Display -->
      <div class="relative w-full min-h-[300px] border border-white/5 bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center">
        <!-- Grid overlay background -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

        <svg viewBox="0 0 500 280" class="w-full h-full z-10 overflow-visible">
          <!-- Connection Lines between regions (backbone network) -->
          <!-- Herat to Mazar -->
          <path d="M 70 120 Q 150 70 250 80" fill="none" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1.5" stroke-dasharray="4 4" class="animated-cable" />
          <!-- Herat to Kandahar -->
          <path d="M 70 120 Q 100 200 170 210" fill="none" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1.5" stroke-dasharray="4 4" class="animated-cable" />
          <!-- Kandahar to Kabul -->
          <path d="M 170 210 Q 280 200 370 140" fill="none" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1.5" stroke-dasharray="4 4" class="animated-cable" />
          <!-- Mazar to Kabul -->
          <path d="M 250 80 Q 320 100 370 140" fill="none" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1.5" stroke-dasharray="4 4" class="animated-cable" />
          <!-- Kabul to Jalalabad -->
          <path d="M 370 140 L 440 145" fill="none" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1.5" stroke-dasharray="4 4" class="animated-cable" />

          <!-- Region Hotspots -->
          @for (node of mapNodes(); track node.region) {
            <g class="cursor-pointer group" (click)="onNodeClick(node.region)">
              <!-- Pulsing outer circle -->
              <circle [attr.cx]="node.x" [attr.cy]="node.y" [attr.r]="node.radius * 2" 
                      class="fill-indigo-500/10 stroke-indigo-500/30 stroke-1 animate-ping origin-center"
                      [style.transform-origin]="node.x + 'px ' + node.y + 'px'" />
              
              <!-- Shimmer fill circle -->
              <circle [attr.cx]="node.x" [attr.cy]="node.y" [attr.r]="node.radius" 
                      class="fill-indigo-500/30 stroke-indigo-400 stroke-1.5 transition-all duration-300 group-hover:fill-indigo-400/50 group-hover:r-[node.radius + 2]"
                      (mouseenter)="setTooltip(node.region, node.value, node.x, node.y)"
                      (mouseleave)="clearTooltip()" />

              <!-- Core center beacon -->
              <circle [attr.cx]="node.x" [attr.cy]="node.y" r="4" 
                      class="fill-white shadow-md" />

              <!-- Label text -->
              <text [attr.x]="node.x" [attr.y]="node.y - node.radius - 6" 
                    text-anchor="middle" 
                    class="fill-slate-300 font-semibold text-[10px] drop-shadow-md select-none group-hover:fill-white">
                {{ node.region }}
              </text>
            </g>
          }
        </svg>

        <!-- Hover Tooltip -->
        @if (tooltip().show) {
          <div class="absolute z-20 pointer-events-none rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
               [style.left.px]="tooltip().x"
               [style.top.px]="tooltip().y - 50">
            <p class="font-bold text-white">{{ tooltip().region }}</p>
            <p class="text-indigo-400 font-semibold mt-0.5">{{ formatMetric(tooltip().value) }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes dash {
      to {
        stroke-dashoffset: -20;
      }
    }
    .animated-cable {
      animation: dash 10s linear infinite;
      stroke-dashoffset: 200;
    }
  `]
})
export class MapComponent {
  props = input.required<any>();
  events = input<any[]>([]);

  private actionService = inject(A2UIActionService);

  // Tooltip State
  tooltip = signal({ show: false, region: '', value: 0, x: 0, y: 0 });

  // Map Coordinates of Afghanistan centers
  private coordinates: Record<string, { x: number, y: number }> = {
    'Kabul': { x: 370, y: 140 },
    'Herat': { x: 70, y: 120 },
    'Mazar-e-Sharif': { x: 250, y: 80 },
    'Kandahar': { x: 170, y: 210 },
    'Jalalabad': { x: 440, y: 145 }
  };

  mapNodes = computed(() => {
    const data = this.props().data || [];
    const regionKey = this.props().regionKey || 'region';
    const valueKey = this.props().valueKey || 'count';

    const values = data.map((d: any) => Number(d[valueKey]) || 0);
    const maxVal = Math.max(...values, 1);

    return data.map((d: any) => {
      const regionName = d[regionKey];
      const coords = this.coordinates[regionName] || { x: 250, y: 140 }; // center fallback
      const val = Number(d[valueKey]) || 0;
      
      // Calculate hotspot sizing (between 8px and 22px)
      const radius = 8 + (val / maxVal) * 14;

      return {
        region: regionName,
        x: coords.x,
        y: coords.y,
        value: val,
        radius
      };
    });
  });

  setTooltip(region: string, value: number, x: number, y: number): void {
    this.tooltip.set({ show: true, region, value, x, y });
  }

  clearTooltip(): void {
    this.tooltip.set({ show: false, region: '', value: 0, x: 0, y: 0 });
  }

  formatMetric(val: number): string {
    const valueKey = this.props().valueKey || 'count';
    if (valueKey === 'amount') {
      return '$' + val.toLocaleString();
    }
    if (valueKey === 'data_mb') {
      return (val / 1024).toFixed(1) + ' GB';
    }
    return val.toLocaleString() + ' Subscribers';
  }

  onNodeClick(region: string): void {
    const clickEvent = this.events().find(e => e.event === 'click');
    if (clickEvent && clickEvent.action) {
      this.actionService.handleAction(clickEvent.action, region);
    }
  }
}
