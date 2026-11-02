import { Component, input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A2UIActionService } from '../../../core/services/a2ui-action.service';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'a2ui-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between h-full transition-all duration-200 hover:border-white/20">
      <!-- Title & Header -->
      <div class="mb-4 flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-white tracking-tight">{{ props().title || 'Analytics Chart' }}</h3>
            <span class="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              {{ chartTypeLabel() }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-[11px] text-slate-400 font-medium">Telecom BI Intelligence Visualizer</p>
            @if (activeFilterValue()) {
              <span class="inline-flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                Filtered: {{ activeFilterValue() }}
                <button (click)="clearLocalFilter()" class="hover:text-white transition-colors" title="Clear filter">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </span>
            }
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center gap-2 text-xs">
          <button (click)="exportLocalData()" class="rounded-lg bg-slate-800/60 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-white/5" title="Export CSV Data">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Chart Viewport Area -->
      <div class="relative flex-1 flex items-center justify-center w-full min-h-[250px] select-none">
        
        <!-- 1. LINE CHART -->
        @if (chartType() === 'line') {
          <svg viewBox="0 0 500 240" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="lineGrad_{{ id() }}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            
            <text x="32" y="24" text-anchor="end" class="fill-slate-500 text-[10px] font-mono">{{ formatNumber(lineMaxVal()) }}</text>
            <text x="32" y="134" text-anchor="end" class="fill-slate-500 text-[10px] font-mono">{{ formatNumber(lineMidVal()) }}</text>
            <text x="32" y="194" text-anchor="end" class="fill-slate-500 text-[10px] font-mono">{{ formatNumber(lineMinVal()) }}</text>

            @if (linePoints().length > 0) {
              <path [attr.d]="lineAreaPath()" [attr.fill]="'url(#lineGrad_' + id() + ')'" />
              <path [attr.d]="linePath()" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
              @for (pt of linePoints(); track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" 
                        class="fill-indigo-400 stroke-slate-900 stroke-2 cursor-pointer transition-all duration-200 hover:r-6 hover:fill-white" 
                        (mouseenter)="setTooltip(pt.label, pt.value, pt.x, pt.y)"
                        (mouseleave)="clearTooltip()" />
              }
            }
            @for (pt of linePoints(); track $index) {
              @if ($index % (linePoints().length > 8 ? 3 : 1) === 0) {
                <text [attr.x]="pt.x" y="215" text-anchor="middle" class="fill-slate-400 text-[9px]">{{ pt.labelShort }}</text>
              }
            }
          </svg>
        }

        <!-- 2. VERTICAL BAR CHART (COLUMN) -->
        @if (chartType() === 'bar' || chartType() === 'column') {
          <svg viewBox="0 0 500 240" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="barGrad_{{ id() }}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#06b6d4"/>
                <stop offset="100%" stop-color="#4f46e5"/>
              </linearGradient>
            </defs>
            <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            @for (bar of barData(); track $index) {
              <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" 
                    rx="4" ry="4"
                    class="cursor-pointer transition-all duration-300 hover:brightness-125"
                    [attr.fill]="'url(#barGrad_' + id() + ')'"
                    (click)="triggerClick(bar.label)"
                    (mouseenter)="setTooltip(bar.label, bar.value, bar.x + bar.width/2, bar.y)"
                    (mouseleave)="clearTooltip()" />
              <text [attr.x]="bar.x + bar.width/2" y="212" text-anchor="middle" class="fill-slate-400 text-[10px]">{{ bar.label }}</text>
            }
          </svg>
        }

        <!-- 3. HORIZONTAL BAR CHART (LEADERBOARD / RANKING) -->
        @if (chartType() === 'horizontal_bar') {
          <div class="w-full flex flex-col gap-2.5 px-2">
            @for (item of horizontalBarData(); track $index) {
              <div class="flex items-center gap-3 group cursor-pointer" (click)="triggerClick(item.label)"
                   (mouseenter)="setTooltip(item.label, item.value, 200, 100)" (mouseleave)="clearTooltip()">
                <div class="w-28 text-right text-xs font-semibold text-slate-300 truncate">{{ item.label }}</div>
                <div class="flex-1 bg-slate-950/60 rounded-full h-4 overflow-hidden border border-white/5 relative p-0.5">
                  <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                       [style.width.%]="item.pct"></div>
                </div>
                <div class="w-16 text-left text-xs font-bold text-cyan-300 font-mono">{{ item.formattedValue }}</div>
              </div>
            }
          </div>
        }

        <!-- 4. STACKED BAR CHART -->
        @if (chartType() === 'stacked_bar') {
          <div class="w-full flex flex-col items-center">
            <svg viewBox="0 0 500 220" class="w-full h-full overflow-visible">
              <line x1="40" y1="180" x2="480" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
              @for (st of stackedBarData(); track $index) {
                <!-- Segments -->
                @for (seg of st.segments; track seg.key) {
                  <rect [attr.x]="st.x" [attr.y]="seg.y" [attr.width]="st.width" [attr.height]="seg.height"
                        [attr.fill]="seg.color"
                        class="cursor-pointer transition-all hover:opacity-80"
                        (mouseenter)="setTooltip(st.label + ' - ' + seg.key, seg.value, st.x + st.width/2, seg.y)"
                        (mouseleave)="clearTooltip()" />
                }
                <text [attr.x]="st.x + st.width/2" y="202" text-anchor="middle" class="fill-slate-400 text-[10px]">{{ st.label }}</text>
              }
            </svg>
            <div class="flex items-center gap-4 mt-2 text-xs">
              <div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded bg-indigo-500"></span><span class="text-slate-300">Data</span></div>
              <div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded bg-cyan-400"></span><span class="text-slate-300">Voice</span></div>
              <div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded bg-amber-400"></span><span class="text-slate-300">SMS</span></div>
            </div>
          </div>
        }

        <!-- 5. PIE / DONUT CHART -->
        @if (chartType() === 'pie' || chartType() === 'donut') {
          <div class="flex items-center gap-6 w-full justify-center">
            <svg viewBox="0 0 200 200" class="w-48 h-48 overflow-visible flex-shrink-0">
              @for (slice of pieSlices(); track $index) {
                <path [attr.d]="slice.path" [attr.fill]="slice.color"
                      class="cursor-pointer transition-all duration-300 hover:scale-105 origin-[100px_100px]"
                      (click)="triggerClick(slice.label)"
                      (mouseenter)="setTooltip(slice.label, slice.value + ' (' + slice.percentage + '%)', 100, 100)"
                      (mouseleave)="clearTooltip()" />
              }
              @if (chartType() === 'donut') {
                <circle cx="100" cy="100" r="50" class="fill-[#0d1228]" />
                <text x="100" y="93" text-anchor="middle" class="fill-slate-500 text-[9px] font-bold tracking-wider">TOTAL</text>
                <text x="100" y="115" text-anchor="middle" class="fill-white text-base font-black">{{ totalPieValue() }}</text>
              }
            </svg>
            <div class="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              @for (slice of pieSlices(); track $index) {
                <div class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white" (click)="triggerClick(slice.label)">
                  <span class="h-2.5 w-2.5 rounded-full flex-shrink-0" [style.background-color]="slice.color"></span>
                  <span class="font-medium truncate max-w-[90px]">{{ slice.label }}</span>
                  <span class="text-slate-400 font-mono ml-auto">{{ slice.percentage }}%</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- 6. AREA CHART -->
        @if (chartType() === 'area') {
          <svg viewBox="0 0 500 240" class="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="areaGrad_{{ id() }}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="105" x2="480" y2="105" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <path [attr.d]="lineAreaPath()" [attr.fill]="'url(#areaGrad_' + id() + ')'" />
            <path [attr.d]="linePath()" fill="none" stroke="#10b981" stroke-width="2.5" />
            @for (pt of linePoints(); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" class="fill-emerald-400 stroke-slate-900 stroke-2 cursor-pointer hover:r-6 hover:fill-white"
                      (mouseenter)="setTooltip(pt.label, pt.value, pt.x, pt.y)" (mouseleave)="clearTooltip()" />
            }
          </svg>
        }

        <!-- 7. STACKED AREA CHART -->
        @if (chartType() === 'stacked_area') {
          <svg viewBox="0 0 500 240" class="w-full h-full overflow-visible">
            <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <path [attr.d]="stackedAreaBottomPath()" fill="#6366f1" fill-opacity="0.4" stroke="#6366f1" stroke-width="2" />
            <path [attr.d]="stackedAreaTopPath()" fill="#06b6d4" fill-opacity="0.4" stroke="#06b6d4" stroke-width="2" />
          </svg>
        }

        <!-- 8. SCATTER PLOT -->
        @if (chartType() === 'scatter') {
          <svg viewBox="0 0 500 240" class="w-full h-full overflow-visible">
            <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="105" x2="480" y2="105" stroke="rgba(255,255,255,0.06)" />
            <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <line x1="40" y1="20" x2="40" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            @for (pt of scatterPoints(); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" [attr.r]="pt.r"
                      class="fill-cyan-400/80 stroke-indigo-500 stroke-2 cursor-pointer transition-all hover:r-8 hover:fill-cyan-300"
                      (mouseenter)="setTooltip(pt.label, pt.tooltipValue, pt.x, pt.y)"
                      (mouseleave)="clearTooltip()" />
            }
          </svg>
        }

        <!-- 9. BUBBLE CHART (3-METRIC VISUALIZATION) -->
        @if (chartType() === 'bubble') {
          <svg viewBox="0 0 500 240" class="w-full h-full overflow-visible">
            <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <line x1="40" y1="20" x2="40" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            @for (b of bubbleData(); track $index) {
              <circle [attr.cx]="b.x" [attr.cy]="b.y" [attr.r]="b.radius"
                      [attr.fill]="b.color" fill-opacity="0.6" stroke="#ffffff" stroke-width="1.5"
                      class="cursor-pointer transition-all hover:fill-opacity-90 hover:scale-110"
                      (mouseenter)="setTooltip(b.label, b.tooltip, b.x, b.y)"
                      (mouseleave)="clearTooltip()" />
              <text [attr.x]="b.x" [attr.y]="b.y + 3" text-anchor="middle" class="fill-white text-[9px] font-bold pointer-events-none">{{ b.labelShort }}</text>
            }
          </svg>
        }

        <!-- 10. HEATMAP MATRIX -->
        @if (chartType() === 'heatmap') {
          <div class="flex flex-col w-full items-center p-1">
            <div class="grid gap-1 border border-white/5 p-2 rounded-xl bg-slate-950/40 w-full"
                 [style.grid-template-columns]="'repeat(' + heatmapCols().length + ', minmax(0, 1fr))'">
              @for (col of heatmapCols(); track $index) {
                <div class="text-center text-[9px] font-bold text-slate-500 uppercase py-1 truncate">{{ col }}</div>
              }
              @for (row of heatmapRows(); track $index) {
                @for (col of heatmapCols(); track col) {
                  @let cell = getHeatmapCell(row, col);
                  <div class="h-9 rounded flex flex-col items-center justify-center text-[10px] font-medium text-white transition-all hover:scale-105 cursor-pointer"
                       [style.background-color]="cell.color"
                       (mouseenter)="setTooltip(row + ' / ' + col, cell.value + ' MB', 250, 100)"
                       (mouseleave)="clearTooltip()">
                    <span class="text-[9px] opacity-80 font-mono">{{ cell.valueShort }}</span>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- 11. GAUGE / SPEEDOMETER -->
        @if (chartType() === 'gauge') {
          <div class="flex flex-col items-center justify-center w-full py-2">
            <svg viewBox="0 0 200 120" class="w-56 h-32 overflow-visible">
              <defs>
                <linearGradient id="gaugeGrad_{{ id() }}" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="60%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#f43f5e"/>
                </linearGradient>
              </defs>
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="16" stroke-linecap="round" />
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" [attr.stroke]="'url(#gaugeGrad_' + id() + ')'" 
                    stroke-width="16" stroke-linecap="round" [attr.stroke-dasharray]="251.3" [attr.stroke-dashoffset]="gaugeOffset()"
                    class="transition-all duration-1000 ease-out" />
              <text x="100" y="90" text-anchor="middle" class="fill-white text-3xl font-black tracking-tight">{{ gaugeValue() }}%</text>
            </svg>
            <p class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">{{ props().title || 'SLA Target Completion' }}</p>
          </div>
        }

        <!-- 12. RADAR / SPIDER CHART -->
        @if (chartType() === 'radar' || chartType() === 'spider') {
          <div class="flex items-center justify-center w-full">
            <svg viewBox="0 0 240 240" class="w-56 h-56 overflow-visible">
              <!-- Concentric Polygons -->
              @for (level of [0.25, 0.5, 0.75, 1.0]; track level) {
                <polygon [attr.points]="getRadarPolygonPoints(level)" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
              }
              <!-- Axis lines -->
              @for (axis of radarAxes(); track axis.label) {
                <line x1="120" y1="120" [attr.x2]="axis.x" [attr.y2]="axis.y" stroke="rgba(255,255,255,0.12)" />
                <text [attr.x]="axis.labelX" [attr.y]="axis.labelY" text-anchor="middle" class="fill-slate-400 text-[8.5px] font-semibold">{{ axis.label }}</text>
              }
              <!-- Value Polygon -->
              <polygon [attr.points]="radarDataPolygon()" fill="#6366f1" fill-opacity="0.35" stroke="#6366f1" stroke-width="2" />
              @for (axis of radarAxes(); track axis.label) {
                <circle [attr.cx]="axis.dataX" [attr.cy]="axis.dataY" r="4" class="fill-cyan-400 stroke-slate-900 stroke-1.5 cursor-pointer hover:r-6"
                        (mouseenter)="setTooltip(axis.label, axis.value + '% Score', axis.dataX, axis.dataY)" (mouseleave)="clearTooltip()" />
              }
            </svg>
          </div>
        }

        <!-- 13. TREEMAP -->
        @if (chartType() === 'treemap') {
          <div class="w-full h-52 grid grid-cols-6 grid-rows-3 gap-1.5 p-1">
            @for (item of treemapData(); track item.label) {
              <div [class]="item.spanClass" [style.background-color]="item.color"
                   class="rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:brightness-110 hover:shadow-lg border border-white/10"
                   (click)="triggerClick(item.label)"
                   (mouseenter)="setTooltip(item.label, item.value + ' (' + item.share + '%)', 200, 100)"
                   (mouseleave)="clearTooltip()">
                <p class="text-xs font-bold text-white truncate drop-shadow">{{ item.label }}</p>
                <p class="text-xs font-black text-white/90 font-mono">{{ item.formattedValue }}</p>
              </div>
            }
          </div>
        }

        <!-- 14. FUNNEL CHART -->
        @if (chartType() === 'funnel') {
          <div class="w-full flex flex-col items-center gap-1.5 px-4 py-2">
            @for (stage of funnelData(); track stage.label) {
              <div class="h-8 rounded-lg flex items-center justify-between px-3 cursor-pointer transition-all hover:brightness-125 border border-white/10"
                   [style.width.%]="stage.widthPct" [style.background-color]="stage.color"
                   (mouseenter)="setTooltip(stage.label, stage.count + ' (' + stage.pct + '% conversion)', 250, 100)"
                   (mouseleave)="clearTooltip()">
                <span class="text-xs font-bold text-white truncate">{{ stage.label }}</span>
                <span class="text-xs font-black text-white/90 font-mono">{{ stage.count }}</span>
              </div>
            }
          </div>
        }

        <!-- 15. WATERFALL CHART -->
        @if (chartType() === 'waterfall') {
          <svg viewBox="0 0 500 220" class="w-full h-full overflow-visible">
            <line x1="30" y1="180" x2="480" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            @for (bar of waterfallData(); track bar.label) {
              <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height"
                    [attr.fill]="bar.color" rx="3" ry="3"
                    class="cursor-pointer transition-all hover:brightness-125"
                    (mouseenter)="setTooltip(bar.label, bar.amount + ' (Balance: ' + bar.runningTotal + ')', bar.x + bar.width/2, bar.y)"
                    (mouseleave)="clearTooltip()" />
              <text [attr.x]="bar.x + bar.width/2" y="198" text-anchor="middle" class="fill-slate-400 text-[9px]">{{ bar.label }}</text>
            }
          </svg>
        }

        <!-- 16. BOX PLOT (WHISKER PLOT) -->
        @if (chartType() === 'boxplot') {
          <svg viewBox="0 0 500 220" class="w-full h-full overflow-visible">
            <line x1="30" y1="180" x2="480" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            @for (bp of boxplotData(); track bp.group) {
              <!-- Whiskers -->
              <line [attr.x1]="bp.x + bp.width/2" [attr.y1]="bp.minY" [attr.x2]="bp.x + bp.width/2" [attr.y2]="bp.maxY" stroke="#94a3b8" stroke-width="1.5" />
              <line [attr.x1]="bp.x" [attr.y1]="bp.minY" [attr.x2]="bp.x + bp.width" [attr.y2]="bp.minY" stroke="#94a3b8" stroke-width="1.5" />
              <line [attr.x1]="bp.x" [attr.y1]="bp.maxY" [attr.x2]="bp.x + bp.width" [attr.y2]="bp.maxY" stroke="#94a3b8" stroke-width="1.5" />
              <!-- Box (Q1 to Q3) -->
              <rect [attr.x]="bp.x" [attr.y]="bp.q3Y" [attr.width]="bp.width" [attr.height]="bp.q1Y - bp.q3Y"
                    fill="#6366f1" fill-opacity="0.3" stroke="#6366f1" stroke-width="2" rx="4"
                    class="cursor-pointer hover:fill-opacity-50"
                    (mouseenter)="setTooltip(bp.group, 'Min: ' + bp.min + ' | Med: ' + bp.median + ' | Max: ' + bp.max, bp.x + bp.width/2, bp.medianY)"
                    (mouseleave)="clearTooltip()" />
              <!-- Median line -->
              <line [attr.x1]="bp.x" [attr.y1]="bp.medianY" [attr.x2]="bp.x + bp.width" [attr.y2]="bp.medianY" stroke="#06b6d4" stroke-width="2" />
              <text [attr.x]="bp.x + bp.width/2" y="200" text-anchor="middle" class="fill-slate-400 text-[10px]">{{ bp.group }}</text>
            }
          </svg>
        }

        <!-- 17. BULLET CHART -->
        @if (chartType() === 'bullet') {
          <div class="w-full flex flex-col gap-4 px-2 py-2">
            @for (item of bulletData(); track item.metric) {
              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{{ item.metric }}</span>
                  <span class="text-cyan-400 font-mono">{{ item.actual }} / {{ item.target }} (Target)</span>
                </div>
                <div class="relative w-full h-6 rounded bg-slate-800 overflow-hidden flex items-center">
                  <!-- Qualitative bands: Poor, Fair, Good -->
                  <div class="absolute left-0 top-0 bottom-0 bg-rose-500/15 w-[33%]"></div>
                  <div class="absolute left-[33%] top-0 bottom-0 bg-amber-500/15 w-[33%]"></div>
                  <div class="absolute left-[66%] top-0 bottom-0 bg-emerald-500/15 w-[34%]"></div>
                  <!-- Actual Bar -->
                  <div class="h-3.5 rounded bg-gradient-to-r from-indigo-500 to-cyan-400 relative z-10" [style.width.%]="item.actualPct"></div>
                  <!-- Target Line Marker -->
                  <div class="absolute top-0 bottom-0 w-1 bg-white shadow-md z-20" [style.left.%]="item.targetPct"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- 18. CANDLESTICK (OHLC) CHART -->
        @if (chartType() === 'candlestick') {
          <svg viewBox="0 0 500 220" class="w-full h-full overflow-visible">
            <line x1="30" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            @for (candle of candlestickData(); track candle.time) {
              <!-- Wick -->
              <line [attr.x1]="candle.x" [attr.y1]="candle.highY" [attr.x2]="candle.x" [attr.y2]="candle.lowY" [attr.stroke]="candle.bullish ? '#10b981' : '#f43f5e'" stroke-width="1.5" />
              <!-- Candle Body -->
              <rect [attr.x]="candle.x - 6" [attr.y]="candle.bodyY" width="12" [attr.height]="candle.bodyHeight"
                    [attr.fill]="candle.bullish ? '#10b981' : '#f43f5e'" rx="2" ry="2"
                    class="cursor-pointer hover:brightness-125"
                    (mouseenter)="setTooltip(candle.time, 'Open: ' + candle.open + ' | Close: ' + candle.close + ' | High: ' + candle.high + ' | Low: ' + candle.low, candle.x, candle.bodyY)"
                    (mouseleave)="clearTooltip()" />
              <text [attr.x]="candle.x" y="210" text-anchor="middle" class="fill-slate-400 text-[9px]">{{ candle.timeShort }}</text>
            }
          </svg>
        }

        <!-- 19. POLAR / ROSE AREA CHART -->
        @if (chartType() === 'polar') {
          <div class="flex items-center justify-center w-full">
            <svg viewBox="0 0 220 220" class="w-56 h-56 overflow-visible">
              <circle cx="110" cy="110" r="30" fill="none" stroke="rgba(255,255,255,0.06)" />
              <circle cx="110" cy="110" r="60" fill="none" stroke="rgba(255,255,255,0.06)" />
              <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.06)" />
              @for (petal of polarData(); track petal.label) {
                <path [attr.d]="petal.path" [attr.fill]="petal.color" fill-opacity="0.6" stroke="#ffffff" stroke-width="1"
                      class="cursor-pointer transition-all hover:scale-105 origin-[110px_110px]"
                      (mouseenter)="setTooltip(petal.label, petal.value, 110, 110)" (mouseleave)="clearTooltip()" />
              }
            </svg>
          </div>
        }

        <!-- 20. SANKEY FLOW DIAGRAM -->
        @if (chartType() === 'sankey') {
          <div class="w-full flex items-center justify-between px-6 py-2">
            <!-- Stage 1 Columns -->
            <div class="flex flex-col gap-4">
              <div class="bg-indigo-600/30 border border-indigo-500/40 p-2 rounded-lg text-xs font-bold text-white w-28 text-center">4G Network</div>
              <div class="bg-cyan-600/30 border border-cyan-500/40 p-2 rounded-lg text-xs font-bold text-white w-28 text-center">5G High-Speed</div>
              <div class="bg-emerald-600/30 border border-emerald-500/40 p-2 rounded-lg text-xs font-bold text-white w-28 text-center">Fiber Optics</div>
            </div>
            <!-- Dynamic flow links in SVG -->
            <svg viewBox="0 0 200 160" class="flex-1 h-36">
              <path d="M 0 25 C 100 25, 100 25, 200 25" fill="none" stroke="#6366f1" stroke-width="16" stroke-opacity="0.3" />
              <path d="M 0 80 C 100 80, 100 80, 200 80" fill="none" stroke="#06b6d4" stroke-width="22" stroke-opacity="0.3" />
              <path d="M 0 135 C 100 135, 100 80, 200 80" fill="none" stroke="#10b981" stroke-width="14" stroke-opacity="0.3" />
            </svg>
            <!-- Stage 2 Targets -->
            <div class="flex flex-col gap-4">
              <div class="bg-purple-600/30 border border-purple-500/40 p-2 rounded-lg text-xs font-bold text-white w-28 text-center">Corporate Cloud</div>
              <div class="bg-amber-600/30 border border-amber-500/40 p-2 rounded-lg text-xs font-bold text-white w-28 text-center">Mobile Consumers</div>
            </div>
          </div>
        }

        <!-- 21. SPARKLINE KPI CARD -->
        @if (chartType() === 'sparkline') {
          <div class="w-full flex flex-col justify-center items-center py-4">
            <span class="text-4xl font-extrabold text-white tracking-tight font-mono">{{ sparklineData().currentValue }}</span>
            <div class="flex items-center gap-1.5 mt-2">
              <span [class]="sparklineData().isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'"
                    class="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 border"
                    [class.border-emerald-500/20]="sparklineData().isPositive" [class.border-rose-500/20]="!sparklineData().isPositive">
                {{ sparklineData().trend }}
              </span>
              <span class="text-slate-400 text-xs">vs last 7 days</span>
            </div>
            <svg viewBox="0 0 280 60" class="w-64 h-16 mt-3">
              <path [attr.d]="sparklineData().path" fill="none" [attr.stroke]="sparklineData().isPositive ? '#10b981' : '#f43f5e'" stroke-width="2.5" />
            </svg>
          </div>
        }

        <!-- 22. CHORD / NETWORK MATRIX -->
        @if (chartType() === 'chord') {
          <div class="flex items-center justify-center w-full">
            <svg viewBox="0 0 220 220" class="w-56 h-56 overflow-visible">
              <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6" />
              <!-- Bilateral chords -->
              <path d="M 110 20 Q 110 110 200 110" fill="none" stroke="#6366f1" stroke-width="4" stroke-opacity="0.4" />
              <path d="M 200 110 Q 110 110 110 200" fill="none" stroke="#06b6d4" stroke-width="3" stroke-opacity="0.4" />
              <path d="M 110 200 Q 110 110 20 110" fill="none" stroke="#10b981" stroke-width="5" stroke-opacity="0.4" />
              <path d="M 20 110 Q 110 110 110 20" fill="none" stroke="#f59e0b" stroke-width="4" stroke-opacity="0.4" />
              <!-- Regional nodes around ring -->
              <circle cx="110" cy="20" r="6" fill="#6366f1" /><text x="110" y="10" text-anchor="middle" class="fill-white text-[9px] font-bold">Kabul</text>
              <circle cx="200" cy="110" r="6" fill="#06b6d4" /><text x="215" y="113" text-anchor="start" class="fill-white text-[9px] font-bold">Mazar</text>
              <circle cx="110" cy="200" r="6" fill="#10b981" /><text x="110" y="215" text-anchor="middle" class="fill-white text-[9px] font-bold">Herat</text>
              <circle cx="20" cy="110" r="6" fill="#f59e0b" /><text x="5" y="113" text-anchor="end" class="fill-white text-[9px] font-bold">Kandahar</text>
            </svg>
          </div>
        }

        <!-- Hover Tooltip Overlay -->
        @if (tooltip().show) {
          <div class="absolute z-30 pointer-events-none rounded-lg bg-slate-950/95 border border-white/10 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
               [style.left.px]="tooltip().x"
               [style.top.px]="tooltip().y - 45">
            <p class="font-semibold text-slate-300">{{ tooltip().title }}</p>
            <p class="text-cyan-400 font-bold mt-0.5 font-mono">{{ tooltip().value }}</p>
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

  chartType = computed(() => {
    return this.props().chartType || 'line';
  });

  chartTypeLabel = computed(() => {
    const t = this.chartType();
    return t.replace(/_/g, ' ').toUpperCase();
  });

  // Tooltip
  tooltip = signal({ show: false, title: '', value: '', x: 0, y: 0 });

  setTooltip(title: string, value: any, x: number, y: number): void {
    this.tooltip.set({ show: true, title, value: String(value), x: Math.max(10, Math.min(x, 400)), y: Math.max(10, y) });
  }

  clearTooltip(): void {
    this.tooltip.set({ show: false, title: '', value: '', x: 0, y: 0 });
  }

  // Active filter
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

  formatNumber(val: number): string {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return String(Math.round(val));
  }

  // 1. Line Chart Computations
  lineMaxVal = computed(() => {
    const data = this.filteredData();
    if (!data.length) return 100;
    const yAxisKey = this.props().yAxis || 'amount';
    return Math.max(...data.map((d: any) => Number(d[yAxisKey]) || 0), 10);
  });
  lineMinVal = computed(() => 0);
  lineMidVal = computed(() => Math.round(this.lineMaxVal() / 2));

  linePoints = computed(() => {
    const data = this.filteredData() || [];
    if (data.length === 0) return [];
    const xAxisKey = this.props().xAxis || 'date';
    const yAxisKey = this.props().yAxis || 'amount';

    const maxVal = this.lineMaxVal();
    const minVal = this.lineMinVal();
    const valRange = maxVal - minVal || 1;

    const w = 440;
    const h = 170;
    const startX = 40;
    const startY = 190;

    return data.map((d: any, idx: number) => {
      const x = startX + (idx / Math.max(data.length - 1, 1)) * w;
      const y = startY - ((Number(d[yAxisKey]) - minVal) / valRange) * h;
      const label = String(d[xAxisKey] || idx);
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
    return `${this.linePath()} L ${pts[pts.length - 1].x} 190 L ${pts[0].x} 190 Z`;
  });

  // 2. Bar Data
  barData = computed(() => {
    const data = this.filteredData() || [];
    if (data.length === 0) return [];
    const xAxisKey = this.props().xAxis || 'region';
    const yAxisKey = this.props().yAxis || 'amount';

    const values = data.map((d: any) => Number(d[yAxisKey]) || 0);
    const maxVal = Math.max(...values, 1);

    const w = 440;
    const h = 170;
    const startX = 40;
    const startY = 190;
    const barSpacing = w / data.length;
    const barWidth = Math.min(barSpacing * 0.65, 40);

    return data.map((d: any, idx: number) => {
      const bHeight = Math.max((Number(d[yAxisKey]) / maxVal) * h, 4);
      const x = startX + idx * barSpacing + (barSpacing - barWidth) / 2;
      const y = startY - bHeight;
      return { x, y, width: barWidth, height: bHeight, label: String(d[xAxisKey]), value: d[yAxisKey] };
    });
  });

  // 3. Horizontal Bar Data
  horizontalBarData = computed(() => {
    const data = this.filteredData() || [];
    const labelKey = this.props().labelKey || this.props().xAxis || 'region';
    const valKey = this.props().valueKey || this.props().yAxis || 'recharge_amount' || 'amount';

    const values = data.map((d: any) => Number(d[valKey]) || 0);
    const maxVal = Math.max(...values, 1);

    return data.slice(0, 7).map((d: any) => {
      const val = Number(d[valKey]) || 0;
      const pct = Math.round((val / maxVal) * 100);
      return {
        label: String(d[labelKey]),
        value: val,
        formattedValue: this.formatNumber(val),
        pct
      };
    });
  });

  // 4. Stacked Bar Data
  stackedBarData = computed(() => {
    const data = this.filteredData() || [];
    const labelKey = this.props().xAxis || 'region';
    const w = 440;
    const startX = 40;
    const startY = 180;
    const barSpacing = w / Math.max(data.length, 1);
    const barWidth = Math.min(barSpacing * 0.6, 36);

    return data.slice(0, 8).map((d: any, idx: number) => {
      const v1 = (Number(d.data_mb) || 300) / 200;
      const v2 = (Number(d.voice_minutes) || 150) / 10;
      const v3 = (Number(d.amount) || 100) / 50;
      const total = v1 + v2 + v3 || 1;
      const totalH = Math.min(150, total);

      const h1 = (v1 / total) * totalH;
      const h2 = (v2 / total) * totalH;
      const h3 = (v3 / total) * totalH;

      const x = startX + idx * barSpacing + (barSpacing - barWidth) / 2;
      return {
        x,
        width: barWidth,
        label: String(d[labelKey] || 'Node ' + (idx + 1)),
        segments: [
          { key: 'Data', value: Math.round(v1), height: h1, y: startY - h1, color: '#6366f1' },
          { key: 'Voice', value: Math.round(v2), height: h2, y: startY - h1 - h2, color: '#06b6d4' },
          { key: 'SMS', value: Math.round(v3), height: h3, y: startY - h1 - h2 - h3, color: '#f59e0b' }
        ]
      };
    });
  });

  // 5. Pie & Donut Computations
  pieSlices = computed(() => {
    const data = this.filteredData() || [];
    if (data.length === 0) return [];
    const labelKey = this.props().labelKey || 'plan';
    const valueKey = this.props().valueKey || 'count';

    const total = data.reduce((acc: number, d: any) => acc + (Number(d[valueKey]) || 0), 0);
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
    let accAngle = 0;

    return data.map((d: any, idx: number) => {
      const val = Number(d[valueKey]) || 0;
      const pct = total > 0 ? (val / total) * 100 : 0;
      const angle = total > 0 ? (val / total) * 360 : 0;

      const rad1 = (accAngle - 90) * Math.PI / 180;
      const rad2 = (accAngle + angle - 90) * Math.PI / 180;
      accAngle += angle;

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

  totalPieValue = computed(() => {
    const data = this.filteredData() || [];
    const valueKey = this.props().valueKey || 'count';
    const total = data.reduce((acc: number, d: any) => acc + (Number(d[valueKey]) || 0), 0);
    return this.formatNumber(total);
  });

  // Stacked Area paths
  stackedAreaBottomPath = computed(() => {
    return 'M 40 160 Q 150 140 260 150 T 480 120 L 480 190 L 40 190 Z';
  });
  stackedAreaTopPath = computed(() => {
    return 'M 40 110 Q 150 80 260 100 T 480 60 L 480 120 Q 370 140 260 150 T 40 160 Z';
  });

  // 8. Scatter & Bubble Data
  scatterPoints = computed(() => {
    const data = this.filteredData() || [];
    const xAxisKey = this.props().xAxis || 'recharge_amount';
    const yAxisKey = this.props().yAxis || 'amount';

    return data.map((d: any, idx: number) => {
      const x = 50 + ((idx * 47) % 410);
      const y = 40 + ((idx * 33) % 135);
      return {
        x,
        y,
        r: 6,
        label: d.msisdn || d.region || `Point ${idx + 1}`,
        tooltipValue: `X: ${x} | Y: ${y}`
      };
    });
  });

  bubbleData = computed(() => {
    const data = this.filteredData() || [];
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    return data.slice(0, 8).map((d: any, idx: number) => {
      const x = 60 + ((idx * 55) % 400);
      const y = 50 + ((idx * 28) % 120);
      const radius = 12 + (idx % 4) * 6;
      return {
        x,
        y,
        radius,
        label: d.region || d.plan || `Entity ${idx + 1}`,
        labelShort: String(d.region || d.plan || `E${idx + 1}`).substring(0, 4),
        color: colors[idx % colors.length],
        tooltip: `${d.region || d.plan}: Traffic Weight ${radius * 12}k`
      };
    });
  });

  // 10. Heatmap
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

  getHeatmapCell(row: any, col: any) {
    const data = this.filteredData() || [];
    const match = data.find((d: any) => String(d.region) === row && String(d.tower) === col);
    const val = match ? Number(match.data_mb) || 0 : 0;
    const intensity = Math.min(val / 15000, 1);
    return {
      value: val,
      valueShort: this.formatNumber(val),
      color: `rgba(16, 185, 129, ${0.15 + intensity * 0.8})`
    };
  }

  // 11. Gauge
  gaugeValue = computed(() => {
    const data = this.filteredData() || [];
    if (!data.length) return 87;
    const valKey = this.props().valueKey || 'value';
    const raw = Number(data[0][valKey]) || 87;
    return Math.min(Math.max(Math.round(raw), 0), 100);
  });

  gaugeOffset = computed(() => {
    const circ = 251.327;
    return circ * (1 - this.gaugeValue() / 100);
  });

  // 12. Radar / Spider Data
  radarAxes = computed(() => {
    const categories = ['Coverage', 'Throughput', 'Latency', 'SLA', 'Retention', 'Satisfaction'];
    const values = [88, 72, 94, 91, 80, 85];
    const cx = 120;
    const cy = 120;
    const r = 85;

    return categories.map((cat, idx) => {
      const angle = (idx / categories.length) * 2 * Math.PI - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const labelX = cx + (r + 18) * Math.cos(angle);
      const labelY = cy + (r + 18) * Math.sin(angle) + 3;

      const dataR = (values[idx] / 100) * r;
      const dataX = cx + dataR * Math.cos(angle);
      const dataY = cy + dataR * Math.sin(angle);

      return { label: cat, value: values[idx], x, y, labelX, labelY, dataX, dataY };
    });
  });

  getRadarPolygonPoints(scale: number): string {
    const axes = this.radarAxes();
    const cx = 120;
    const cy = 120;
    return axes.map((a: any) => {
      const x = cx + (a.x - cx) * scale;
      const y = cy + (a.y - cy) * scale;
      return `${x},${y}`;
    }).join(' ');
  }

  radarDataPolygon = computed(() => {
    return this.radarAxes().map((a: any) => `${a.dataX},${a.dataY}`).join(' ');
  });

  // 13. Treemap Data
  treemapData = computed(() => {
    const spans = ['col-span-3 row-span-2', 'col-span-3 row-span-1', 'col-span-3 row-span-1', 'col-span-2 row-span-1', 'col-span-2 row-span-1', 'col-span-2 row-span-1'];
    const colors = ['#4338ca', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed'];
    const data = this.filteredData();
    const list = data.length ? data.slice(0, 6) : [
      { region: 'Kabul Metro', amount: 45000 },
      { region: 'Herat West', amount: 28000 },
      { region: 'Mazar North', amount: 24000 },
      { region: 'Kandahar South', amount: 19000 },
      { region: 'Jalalabad East', amount: 15000 },
      { region: 'Kunduz Border', amount: 9500 }
    ];

    const total = list.reduce((acc: number, d: any) => acc + (Number(d.amount) || 1), 0);

    return list.map((item: any, idx: number) => {
      const val = Number(item.amount) || 1000;
      return {
        label: item.region || item.plan || `Node ${idx + 1}`,
        value: val,
        formattedValue: '$' + this.formatNumber(val),
        share: Math.round((val / total) * 100),
        spanClass: spans[idx % spans.length],
        color: colors[idx % colors.length]
      };
    });
  });

  // 14. Funnel Data
  funnelData = computed(() => {
    return [
      { label: 'Total Network Impressions', count: '1,250,000', pct: 100, widthPct: 100, color: '#4f46e5' },
      { label: 'SIM Activations', count: '640,000', pct: 51, widthPct: 82, color: '#0891b2' },
      { label: 'Active Data Subscribers', count: '390,000', pct: 31, widthPct: 65, color: '#059669' },
      { label: 'Recurring Plan Users', count: '210,000', pct: 17, widthPct: 50, color: '#d97706' },
      { label: 'VIP Retention Tier', count: '98,000', pct: 8, widthPct: 38, color: '#db2777' }
    ];
  });

  // 15. Waterfall Data
  waterfallData = computed(() => {
    return [
      { label: 'Starting Rev', amount: '+$50k', runningTotal: '$50k', x: 40, y: 80, width: 45, height: 100, color: '#6366f1' },
      { label: 'Data Growth', amount: '+$35k', runningTotal: '$85k', x: 110, y: 40, width: 45, height: 40, color: '#10b981' },
      { label: 'Roaming Exp', amount: '-$15k', runningTotal: '$70k', x: 180, y: 70, width: 45, height: 30, color: '#f43f5e' },
      { label: 'Voice Decline', amount: '-$10k', runningTotal: '$60k', x: 250, y: 90, width: 45, height: 20, color: '#f43f5e' },
      { label: '5G Upsell', amount: '+$25k', runningTotal: '$85k', x: 320, y: 45, width: 45, height: 45, color: '#10b981' },
      { label: 'Net Profit', amount: '$85k', runningTotal: '$85k', x: 400, y: 45, width: 50, height: 135, color: '#06b6d4' }
    ];
  });

  // 16. Boxplot Data
  boxplotData = computed(() => {
    return [
      { group: 'Kabul', min: 120, median: 450, max: 920, x: 60, width: 50, minY: 30, maxY: 170, q1Y: 130, q3Y: 60, medianY: 90 },
      { group: 'Herat', min: 80, median: 320, max: 710, x: 160, width: 50, minY: 55, maxY: 175, q1Y: 140, q3Y: 85, medianY: 110 },
      { group: 'Mazar', min: 150, median: 510, max: 880, x: 260, width: 50, minY: 35, maxY: 165, q1Y: 120, q3Y: 55, medianY: 80 },
      { group: 'Kandahar', min: 90, median: 290, max: 640, x: 360, width: 50, minY: 70, maxY: 175, q1Y: 145, q3Y: 95, medianY: 125 }
    ];
  });

  // 17. Bullet Data
  bulletData = computed(() => {
    return [
      { metric: 'Kabul Data Throughput (Gbps)', actual: 78, target: 85, actualPct: 78, targetPct: 85 },
      { metric: '5G Coverage Population SLA', actual: 92, target: 90, actualPct: 92, targetPct: 90 },
      { metric: 'Voice Quality MOS Index', actual: 68, target: 75, actualPct: 68, targetPct: 75 }
    ];
  });

  // 18. Candlestick Data
  candlestickData = computed(() => {
    return [
      { time: '08:00 AM', timeShort: '08h', open: 120, high: 160, low: 110, close: 150, bullish: true, x: 70, highY: 40, lowY: 170, bodyY: 60, bodyHeight: 80 },
      { time: '11:00 AM', timeShort: '11h', open: 150, high: 175, low: 130, close: 140, bullish: false, x: 150, highY: 30, lowY: 160, bodyY: 80, bodyHeight: 40 },
      { time: '02:00 PM', timeShort: '14h', open: 140, high: 190, low: 135, close: 185, bullish: true, x: 230, highY: 20, lowY: 150, bodyY: 35, bodyHeight: 90 },
      { time: '05:00 PM', timeShort: '17h', open: 185, high: 210, low: 170, close: 200, bullish: true, x: 310, highY: 15, lowY: 120, bodyY: 25, bodyHeight: 50 },
      { time: '08:00 PM', timeShort: '20h', open: 200, high: 205, low: 160, close: 165, bullish: false, x: 390, highY: 20, lowY: 175, bodyY: 30, bodyHeight: 85 }
    ];
  });

  // 19. Polar Data
  polarData = computed(() => {
    const cats = ['KBL-01', 'KBL-02', 'HRT-01', 'MZR-01', 'KDH-01', 'JLD-01'];
    const vals = [90, 75, 60, 85, 50, 68];
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const cx = 110;
    const cy = 110;

    return cats.map((cat, idx) => {
      const angleStep = (2 * Math.PI) / cats.length;
      const startAngle = idx * angleStep - Math.PI / 2;
      const endAngle = startAngle + angleStep;
      const r = vals[idx];

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      return {
        label: cat,
        value: vals[idx] + 'k Traffic',
        color: colors[idx % colors.length],
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
      };
    });
  });

  // 21. Sparkline Data
  sparklineData = computed(() => {
    return {
      currentValue: '$84,520',
      trend: '+14.8%',
      isPositive: true,
      path: 'M 10 45 Q 60 55 100 35 T 180 20 T 270 10'
    };
  });

  triggerClick(category: string): void {
    const clickEvent = this.events().find(e => e.event === 'click');
    if (clickEvent && clickEvent.action) {
      this.actionService.handleAction(clickEvent.action, category);
    }
  }
}
