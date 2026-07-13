import { Component, input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A2UIActionService } from '../../../core/services/a2ui-action.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'a2ui-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
      <!-- Title -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ props().title }}</h3>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-xs text-slate-400">Interactive Telecom Data Visualization</p>
            @if (activeFilterValue()) {
              <span class="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                Filtered: {{ activeFilterValue() }}
                <button (click)="clearLocalFilter()" class="hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </span>
            }
          </div>
        </div>
        
        <!-- Legend & Export -->
        <div class="flex items-center gap-4 text-xs">
          @if (chartType() === 'line') {
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
              <span class="text-slate-300">Metric Value</span>
            </div>
          }
          
          <button (click)="exportLocalData()" class="rounded-lg bg-slate-800/40 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200" title="Export CSV Data">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Chart Content Area -->
      <div class="relative flex items-center justify-center w-full min-h-[260px] select-none">
        
        <!-- 1. LINE CHART -->
        @if (chartType() === 'line') {
          <svg viewBox="0 0 500 250" class="w-full h-full overflow-visible">
            <!-- Gradients -->
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgb(99, 102, 241)" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="rgb(99, 102, 241)" stop-opacity="0.0"/>
              </linearGradient>
            </defs>

            <!-- Gridlines -->
            <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.05)" />
            <line x1="40" y1="210" x2="480" y2="210" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />

            <!-- Y-Axis Labels -->
            <text x="30" y="25" text-anchor="end" class="fill-slate-500 text-[10px]">Max</text>
            <text x="30" y="125" text-anchor="end" class="fill-slate-500 text-[10px]">Mid</text>
            <text x="30" y="214" text-anchor="end" class="fill-slate-500 text-[10px]">Min</text>

            <!-- Line Path & Gradient Fill -->
            @if (linePoints().length > 0) {
              <!-- Area Fill -->
              <path [attr.d]="lineAreaPath()" fill="url(#lineGrad)" />
              
              <!-- Core Line -->
              <path [attr.d]="linePath()" fill="none" stroke="rgb(99, 102, 241)" stroke-width="3" stroke-linecap="round" />
              
              <!-- Hover Dots -->
              @for (pt of linePoints(); track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" 
                        class="fill-indigo-400 stroke-slate-900 stroke-2 cursor-pointer transition-all duration-200 hover:r-6 hover:fill-white" 
                        (mouseenter)="setTooltip(pt.label, pt.value, pt.x, pt.y)"
                        (mouseleave)="clearTooltip()" />
              }
            }

            <!-- X-Axis Labels (Selected ticks) -->
            @for (pt of linePoints(); track $index) {
              @if ($index % (linePoints().length > 10 ? 4 : 2) === 0) {
                <text [attr.x]="pt.x" y="235" text-anchor="middle" class="fill-slate-500 text-[9px]">{{ pt.labelShort }}</text>
              }
            }
          </svg>
        }

        <!-- 2. BAR CHART -->
        @if (chartType() === 'bar') {
          <svg viewBox="0 0 500 250" class="w-full h-full overflow-visible">
            <line x1="40" y1="210" x2="480" y2="210" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />

            <!-- Bars -->
            @for (bar of barData(); track $index) {
              <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" 
                    rx="4" ry="4"
                    class="fill-gradient cursor-pointer transition-all duration-300 hover:fill-cyan-400"
                    style="fill: url(#barGrad)"
                    (click)="triggerClick(bar.label)"
                    (mouseenter)="setTooltip(bar.label, bar.value, bar.x + bar.width/2, bar.y)"
                    (mouseleave)="clearTooltip()" />

              <!-- X-Axis Label -->
              <text [attr.x]="bar.x + bar.width/2" y="232" text-anchor="middle" class="fill-slate-400 text-[10px]">{{ bar.label }}</text>
            }

            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#06b6d4"/> <!-- cyan-500 -->
                <stop offset="100%" stop-color="#6366f1"/> <!-- indigo-500 -->
              </linearGradient>
            </defs>
          </svg>
        }

        <!-- 3. PIE CHART -->
        @if (chartType() === 'pie') {
          <div class="flex items-center gap-8 w-full justify-center">
            <svg viewBox="0 0 200 200" class="w-48 h-48 overflow-visible">
              @for (slice of pieSlices(); track $index) {
                <path [attr.d]="slice.path" [attr.fill]="slice.color"
                      class="cursor-pointer transition-all duration-300 hover:scale-105 origin-[100px_100px]"
                      (mouseenter)="setTooltip(slice.label, slice.value + ' (' + slice.percentage + '%)', 100, 100)"
                      (mouseleave)="clearTooltip()" />
              }
            </svg>

            <!-- Legend -->
            <div class="flex flex-col gap-2">
              @for (slice of pieSlices(); track $index) {
                <div class="flex items-center gap-2 text-xs text-slate-300">
                  <span class="h-3 w-3 rounded-md" [style.background-color]="slice.color"></span>
                  <span class="font-medium">{{ slice.label }}:</span>
                  <span class="text-slate-400">{{ slice.value }} ({{ slice.percentage }}%)</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- 4. HEATMAP -->
        @if (chartType() === 'heatmap') {
          <div class="flex flex-col w-full items-center p-2">
            <div class="grid gap-1 border border-white/5 p-2 rounded-xl bg-slate-950/40 w-full"
                 [style.grid-template-columns]="'repeat(' + heatmapCols().length + ', minmax(0, 1fr))'">
              
              <!-- Columns Headers -->
              @for (col of heatmapCols(); track $index) {
                <div class="text-center text-[9px] font-semibold text-slate-500 uppercase py-1 truncate">{{ col }}</div>
              }
 
              <!-- Matrix cells -->
              @for (row of heatmapRows(); track $index) {
                @for (col of heatmapCols(); track col) {
                  @let cell = getHeatmapCell(row, col);
                  <div class="h-10 rounded flex flex-col items-center justify-center text-[10px] font-medium text-white transition-all duration-200 hover:scale-[1.05] hover:z-10 cursor-help"
                       [style.background-color]="cell.color"
                       (mouseenter)="setTooltip(row + ' / ' + col, cell.value + ' MB', 250, 125)">
                    <span class="text-[9px] opacity-80">{{ cell.valueShort }}</span>
                  </div>
                }
              }
            </div>
            
            <div class="flex items-center gap-6 mt-4 w-full justify-between text-[10px] text-slate-500">
              <div class="flex items-center gap-2">
                <span>Low Usage</span>
                <span class="h-2 w-16 bg-gradient-to-r from-emerald-500/10 to-emerald-500 rounded"></span>
                <span>High Usage</span>
              </div>
              <div class="font-medium text-slate-400">Rows: Regions | Columns: Towers</div>
            </div>
          </div>
        }
 
        <!-- Tooltip overlay -->
        @if (tooltip().show) {
          <div class="absolute z-30 pointer-events-none rounded-lg bg-slate-950/90 border border-white/10 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
               [style.left.px]="tooltip().x"
               [style.top.px]="tooltip().y - 45">
            <p class="font-semibold text-slate-300">{{ tooltip().title }}</p>
            <p class="text-indigo-400 font-medium mt-0.5">{{ tooltip().value }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class ChartComponent {
  id = input<string>('');
  props = input.required<any>();
  events = input<any[]>([]);
  
  private actionService = inject(A2UIActionService);
  private dashboardService = inject(DashboardService);
 
  // Resolved Chart Type
  chartType = computed(() => {
    return this.props().chartType || 'line';
  });
 
  // Tooltip State
  tooltip = signal({ show: false, title: '', value: '', x: 0, y: 0 });
 
  setTooltip(title: string, value: any, x: number, y: number): void {
    this.tooltip.set({ show: true, title, value: String(value), x, y });
  }
 
  clearTooltip(): void {
    this.tooltip.set({ show: false, title: '', value: '', x: 0, y: 0 });
  }

  // Active filter values and actions
  activeFilterValue = computed(() => {
    return this.dashboardService.localFilters()[this.id()];
  });

  clearLocalFilter(): void {
    this.dashboardService.localFilters.update(filters => {
      const copy = { ...filters };
      delete copy[this.id()];
      return copy;
    });
  }

  exportLocalData(): void {
    const data = this.filteredData();
    this.actionService.handleAction({
      type: 'EXPORT_DATA',
      target: '',
      parameter: JSON.stringify(data)
    });
  }

  // Local Reactive Filtered Data
  filteredData = computed(() => {
    const rawData = this.props().data || [];
    const filterVal = this.activeFilterValue();
    if (!filterVal) return rawData;

    return rawData.filter((row: any) => {
      return Object.values(row).some(val => 
        String(val).toLowerCase() === filterVal.toLowerCase()
      );
    });
  });
 
  // 1. Line Chart computations
  linePoints = computed(() => {
    const data = this.filteredData() || [];
    if (data.length === 0) return [];
    
    const xAxisKey = this.props().xAxis || 'date';
    const yAxisKey = this.props().yAxis || 'amount';
 
    const values = data.map((d: any) => Number(d[yAxisKey]) || 0);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const valRange = maxVal - minVal;
 
    // Map 500x250 dimensions, margins: left=40, right=20, top=20, bottom=40
    const w = 440;
    const h = 190;
    const startX = 40;
    const startY = 210;
 
    return data.map((d: any, idx: number) => {
      const x = startX + (idx / Math.max(data.length - 1, 1)) * w;
      const y = startY - ((Number(d[yAxisKey]) - minVal) / valRange) * h;
      const label = String(d[xAxisKey]);
      const labelShort = label.length > 10 ? label.substring(5, 10) : label;
      return { x, y, label, labelShort, value: d[yAxisKey] };
    });
  });
 
  linePath = computed(() => {
    const pts = this.linePoints();
    if (pts.length === 0) return '';
    return pts.map((p: any, idx: number) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });
 
  lineAreaPath = computed(() => {
    const pts = this.linePoints();
    if (pts.length === 0) return '';
    const path = this.linePath();
    return `${path} L ${pts[pts.length - 1].x} 210 L ${pts[0].x} 210 Z`;
  });
 
  // 2. Bar Chart computations
  barData = computed(() => {
    const data = this.filteredData() || [];
    if (data.length === 0) return [];
 
    const xAxisKey = this.props().xAxis || 'region';
    const yAxisKey = this.props().yAxis || 'amount';
 
    const values = data.map((d: any) => Number(d[yAxisKey]) || 0);
    const maxVal = Math.max(...values, 1);
 
    const w = 440;
    const h = 190;
    const startX = 40;
    const startY = 210;
 
    const barSpacing = w / data.length;
    const barWidth = barSpacing * 0.6;
 
    return data.map((d: any, idx: number) => {
      const bHeight = (Number(d[yAxisKey]) / maxVal) * h;
      const x = startX + idx * barSpacing + (barSpacing - barWidth) / 2;
      const y = startY - bHeight;
      return { x, y, width: barWidth, height: bHeight, label: String(d[xAxisKey]), value: d[yAxisKey] };
    });
  });
 
  // 3. Pie Chart computations
  pieSlices = computed(() => {
    const data = this.filteredData() || [];
    if (data.length === 0) return [];
 
    const labelKey = this.props().labelKey || 'plan';
    const valueKey = this.props().valueKey || 'count';
 
    const total = data.reduce((acc: number, d: any) => acc + (Number(d[valueKey]) || 0), 0);
    
    // Aesthetic color palette
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    
    let accumulatedAngle = 0;
 
    return data.map((d: any, idx: number) => {
      const val = Number(d[valueKey]) || 0;
      const pct = total > 0 ? (val / total) * 100 : 0;
      const angle = total > 0 ? (val / total) * 360 : 0;
 
      // Draw SVG arc path
      const rad1 = (accumulatedAngle - 90) * Math.PI / 180;
      const rad2 = (accumulatedAngle + angle - 90) * Math.PI / 180;
      
      accumulatedAngle += angle;
 
      const cx = 100;
      const cy = 100;
      const r = 85;
 
      const x1 = cx + r * Math.cos(rad1);
      const y1 = cy + r * Math.sin(rad1);
      const x2 = cx + r * Math.cos(rad2);
      const y2 = cy + r * Math.sin(rad2);
 
      const largeArc = angle > 180 ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
 
      return {
        path,
        label: String(d[labelKey]),
        value: val,
        percentage: pct.toFixed(1),
        color: colors[idx % colors.length]
      };
    });
  });
 
  // 4. Heatmap computations
  heatmapRows = computed(() => {
    const data = this.filteredData() || [];
    const yAxisKey = this.props().yAxis || 'region';
    return Array.from(new Set(data.map((d: any) => String(d[yAxisKey]))));
  });
 
  heatmapCols = computed(() => {
    const data = this.filteredData() || [];
    const xAxisKey = this.props().xAxis || 'tower';
    return Array.from(new Set(data.map((d: any) => String(d[xAxisKey]))));
  });
 
  getHeatmapCell(row: any, col: any): { value: number, valueShort: string, color: string } {
    const data = this.filteredData() || [];
    const xAxisKey = this.props().xAxis || 'tower';
    const yAxisKey = this.props().yAxis || 'region';
    const valKey = this.props().value || 'data_mb';
 
    const match = data.find((d: any) => String(d[yAxisKey]) === row && String(d[xAxisKey]) === col);
    if (!match) {
      return { value: 0, valueShort: '-', color: 'rgba(255,255,255,0.02)' };
    }
 
    const val = Number(match[valKey]) || 0;
    const values = data.map((d: any) => Number(d[valKey]) || 0);
    const maxVal = Math.max(...values, 1);
    
    // Scale opacity based on value
    const intensity = val / maxVal;
    
    // Format short label (e.g. 12.5k)
    let valueShort = String(val);
    if (val >= 1000) valueShort = (val / 1000).toFixed(1) + 'k';
 
    return {
      value: val,
      valueShort,
      color: `rgba(16, 185, 129, ${0.1 + intensity * 0.8})` // emerald base with varying opacity
    };
  }
 
  // Handle drill down events
  triggerClick(category: string): void {
    const clickEvent = this.events().find(e => e.event === 'click');
    if (clickEvent && clickEvent.action) {
      this.actionService.handleAction(clickEvent.action, category);
    }
  }
}
