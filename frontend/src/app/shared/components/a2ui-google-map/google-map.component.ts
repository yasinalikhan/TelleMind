import { Component, input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A2UIActionService } from '../../../core/services/a2ui-action.service';
import { DashboardService } from '../../../core/services/dashboard.service';

export interface TowerMarker {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  status: 'online' | 'maintenance' | 'alert';
  subscribers: number;
  throughputGbps: number;
  slaPercent: number;
  generation: '5G' | '4G' | '3G';
}

@Component({
  selector: 'a2ui-google-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-md flex flex-col h-full overflow-hidden">
      <!-- Google Map Header -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-white">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-white tracking-tight">{{ props().title || 'Google Maps Telecom Geospatial Center' }}</h3>
              <span class="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Google Maps Engine
              </span>
            </div>
            <p class="text-xs text-slate-400">Live Afghan Base Stations, Cell Towers & Fiber Backbone Feeds</p>
          </div>
        </div>

        <!-- Google Map Style & Layer Selectors -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Style Switcher -->
          <div class="flex rounded-lg bg-slate-950/60 p-1 border border-white/10 text-xs font-semibold">
            <button (click)="mapTheme.set('dark')" [class.bg-indigo-600]="mapTheme() === 'dark'" [class.text-white]="mapTheme() === 'dark'"
                    class="px-2.5 py-1 rounded transition-colors text-slate-400 hover:text-white">Dark</button>
            <button (click)="mapTheme.set('satellite')" [class.bg-indigo-600]="mapTheme() === 'satellite'" [class.text-white]="mapTheme() === 'satellite'"
                    class="px-2.5 py-1 rounded transition-colors text-slate-400 hover:text-white">Satellite</button>
            <button (click)="mapTheme.set('roadmap')" [class.bg-indigo-600]="mapTheme() === 'roadmap'" [class.text-white]="mapTheme() === 'roadmap'"
                    class="px-2.5 py-1 rounded transition-colors text-slate-400 hover:text-white">Roadmap</button>
            <button (click)="mapTheme.set('terrain')" [class.bg-indigo-600]="mapTheme() === 'terrain'" [class.text-white]="mapTheme() === 'terrain'"
                    class="px-2.5 py-1 rounded transition-colors text-slate-400 hover:text-white">Terrain</button>
          </div>

          <!-- Layer Toggles -->
          <button (click)="showCoverage.update(v=>!v)"
                  [class.bg-cyan-500/20]="showCoverage()" [class.text-cyan-300]="showCoverage()" [class.border-cyan-500/40]="showCoverage()"
                  class="px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Coverage
          </button>

          <button (click)="showHeatmap.update(v=>!v)"
                  [class.bg-rose-500/20]="showHeatmap()" [class.text-rose-300]="showHeatmap()" [class.border-rose-500/40]="showHeatmap()"
                  class="px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            </svg>
            Heatmap
          </button>
        </div>
      </div>

      <!-- Quick Preset Navigation Bar -->
      <div class="mb-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span class="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">Preset Zones:</span>
        @for (zone of zones; track zone.name) {
          <button (click)="selectZone(zone)"
                  [class.bg-indigo-600]="selectedZone() === zone.name"
                  [class.text-white]="selectedZone() === zone.name"
                  class="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap text-[11px] font-semibold border border-white/5">
            {{ zone.name }}
          </button>
        }
      </div>

      <!-- Main Map Viewport Canvas -->
      <div class="relative flex-1 w-full min-h-[360px] rounded-xl overflow-hidden border border-white/10 select-none"
           [class.bg-[#080d1e]]="mapTheme() === 'dark'"
           [class.bg-[#11241f]]="mapTheme() === 'satellite'"
           [class.bg-[#1b233a]]="mapTheme() === 'roadmap'"
           [class.bg-[#242119]]="mapTheme() === 'terrain'">

        <!-- Map Layer Background Canvas (Google Maps Themed Grids & Textures) -->
        <div class="absolute inset-0 transition-all duration-500"
             [style.transform]="'scale(' + zoomLevel() + ') translate(' + panX() + 'px, ' + panY() + 'px)'"
             [style.transform-origin]="'center center'">
          
          <!-- Background Grid Coordinate Lines -->
          <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          <!-- Afghanistan Country Contour Silhouette (GeoJSON Path approximation) -->
          <svg viewBox="0 0 800 480" class="w-full h-full overflow-visible pointer-events-none">
            <!-- Landmass base polygon -->
            <path d="M 120 220 L 160 160 L 240 130 L 320 90 L 400 90 L 480 80 L 580 50 L 680 70 L 620 130 L 530 170 L 510 240 L 430 280 L 330 350 L 220 370 L 150 310 Z"
                  [attr.fill]="mapTheme() === 'satellite' ? 'rgba(30,55,40,0.45)' : (mapTheme() === 'terrain' ? 'rgba(70,50,30,0.35)' : 'rgba(30,41,69,0.5)')"
                  stroke="rgba(99, 102, 241, 0.25)" stroke-width="2" />

            <!-- Major Provincial Roadways / Corridors -->
            <path d="M 180 230 Q 300 170 420 160 T 560 190" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round" />
            <path d="M 420 160 Q 380 260 300 320" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round" />
            <path d="M 420 160 L 510 170" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round" />

            <!-- Fiber Optic Backbone Links with animated packets -->
            <g class="animated-fiber">
              <line x1="180" y1="230" x2="340" y2="130" stroke="#06b6d4" stroke-width="1.8" stroke-dasharray="6 4" stroke-opacity="0.6" />
              <line x1="340" y1="130" x2="420" y2="160" stroke="#06b6d4" stroke-width="2" stroke-dasharray="6 4" stroke-opacity="0.8" />
              <line x1="420" y1="160" x2="510" y2="170" stroke="#06b6d4" stroke-width="2" stroke-dasharray="6 4" stroke-opacity="0.8" />
              <line x1="420" y1="160" x2="300" y2="320" stroke="#06b6d4" stroke-width="2" stroke-dasharray="6 4" stroke-opacity="0.8" />
              <line x1="300" y1="320" x2="180" y2="230" stroke="#06b6d4" stroke-width="1.8" stroke-dasharray="6 4" stroke-opacity="0.6" />
            </g>

            <!-- Heatmap Density Rings (if enabled) -->
            @if (showHeatmap()) {
              @for (tower of towers; track tower.id) {
                <circle [attr.cx]="tower.x" [attr.cy]="tower.y" [attr.r]="tower.subscribers / 400"
                        fill="url(#heatGrad)" opacity="0.35" class="animate-pulse" />
              }
            }

            <defs>
              <radialGradient id="heatGrad">
                <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.8"/>
                <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
              </radialGradient>
            </defs>
          </svg>

          <!-- Interactive Towers / Markers on Map -->
          @for (tower of towers; track tower.id) {
            <div class="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group transition-all"
                 [style.left.px]="tower.x" [style.top.px]="tower.y"
                 (click)="openInfoWindow(tower)">
              
              <!-- Coverage Circles (5G/4G/3G) -->
              @if (showCoverage()) {
                <div class="absolute rounded-full border pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 transition-all duration-300"
                     [style.width.px]="getCoverageRadius(tower.generation) * 2"
                     [style.height.px]="getCoverageRadius(tower.generation) * 2"
                     [class.bg-indigo-500/10]="tower.generation === '5G'"
                     [class.border-indigo-400/30]="tower.generation === '5G'"
                     [class.bg-cyan-500/10]="tower.generation === '4G'"
                     [class.border-cyan-400/30]="tower.generation === '4G'"
                     [class.bg-amber-500/5]="tower.generation === '3G'"
                     [class.border-amber-400/20]="tower.generation === '3G'">
                </div>
              }

              <!-- Pulsing Outer Ring -->
              <div class="h-8 w-8 rounded-full animate-ping opacity-30 absolute -inset-1"
                   [class.bg-emerald-400]="tower.status === 'online'"
                   [class.bg-amber-400]="tower.status === 'maintenance'"
                   [class.bg-rose-500]="tower.status === 'alert'"></div>

              <!-- Google Map Pin Icon -->
              <div class="relative flex flex-col items-center">
                <div class="h-6 w-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white/90 transition-transform group-hover:scale-125"
                     [class.bg-emerald-500]="tower.status === 'online'"
                     [class.bg-amber-500]="tower.status === 'maintenance'"
                     [class.bg-rose-500]="tower.status === 'alert'">
                  <!-- Cell Tower SVG icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-white">
                    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm6.364-9.364a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061Zm-11.728 0a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.06 0Zm12.788 11.728a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.06 0ZM4.636 17.364a.75.75 0 0 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 1.06-1.061l1.061 1.06ZM10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                  </svg>
                </div>
                <!-- Pin Pointer -->
                <div class="w-1.5 h-2 -mt-0.5 rounded-b-sm"
                     [class.bg-emerald-600]="tower.status === 'online'"
                     [class.bg-amber-600]="tower.status === 'maintenance'"
                     [class.bg-rose-600]="tower.status === 'alert'"></div>
                <!-- Mini Tower Tag -->
                <span class="mt-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-bold text-white border border-white/10 whitespace-nowrap drop-shadow">
                  {{ tower.name }}
                </span>
              </div>
            </div>
          }
        </div>

        <!-- Google Maps Zoom & Navigation Controls (+ / -) -->
        <div class="absolute right-4 bottom-4 flex flex-col gap-1.5 z-20">
          <button (click)="zoomIn()" class="h-8 w-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 flex items-center justify-center font-bold text-base shadow-xl transition-all" title="Zoom In">+</button>
          <button (click)="zoomOut()" class="h-8 w-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 flex items-center justify-center font-bold text-base shadow-xl transition-all" title="Zoom Out">−</button>
          <button (click)="resetView()" class="h-8 w-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center shadow-xl transition-all" title="Reset Map View">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </button>
        </div>

        <!-- Google Maps Bottom Attribution Watermark -->
        <div class="absolute left-3 bottom-2 flex items-center gap-2 text-[10px] text-slate-500 font-medium z-10 pointer-events-none">
          <span class="font-bold text-slate-400">Google</span> Maps Hybrid Data © 2026 TeleMind Core · Imagery © Landsat / Copernicus
        </div>

        <!-- Google Maps InfoWindow Popup -->
        @if (activeTower(); as tw) {
          <div class="absolute z-30 rounded-xl bg-slate-950/95 border border-indigo-500/40 p-4 shadow-2xl backdrop-blur-xl w-72 animate-in fade-in zoom-in-95 duration-150"
               [style.left.px]="tw.x - 144" [style.top.px]="tw.y - 185">
            <!-- Close Button -->
            <button (click)="closeInfoWindow()" class="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>

            <!-- Info Header -->
            <div class="flex items-center gap-2 mb-2">
              <span class="h-2 w-2 rounded-full"
                    [class.bg-emerald-400]="tw.status === 'online'"
                    [class.bg-amber-400]="tw.status === 'maintenance'"
                    [class.bg-rose-400]="tw.status === 'alert'"></span>
              <h4 class="text-xs font-bold text-white truncate">{{ tw.name }}</h4>
              <span class="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300 border border-indigo-500/30 ml-auto">
                {{ tw.generation }}
              </span>
            </div>

            <!-- GPS Coordinates -->
            <p class="text-[10px] text-slate-400 font-mono mb-3">GPS: {{ tw.lat.toFixed(4) }}°N, {{ tw.lng.toFixed(4) }}°E</p>

            <!-- Telemetry Metrics Grid -->
            <div class="grid grid-cols-2 gap-2 text-xs mb-3">
              <div class="bg-slate-900/80 p-2 rounded-lg border border-white/5">
                <p class="text-[9px] text-slate-500 uppercase font-semibold">Active MSISDN</p>
                <p class="font-bold text-emerald-400 font-mono">{{ tw.subscribers | number }}</p>
              </div>
              <div class="bg-slate-900/80 p-2 rounded-lg border border-white/5">
                <p class="text-[9px] text-slate-500 uppercase font-semibold">Throughput</p>
                <p class="font-bold text-cyan-400 font-mono">{{ tw.throughputGbps }} Gbps</p>
              </div>
              <div class="bg-slate-900/80 p-2 rounded-lg border border-white/5">
                <p class="text-[9px] text-slate-500 uppercase font-semibold">SLA Health</p>
                <p class="font-bold text-white font-mono">{{ tw.slaPercent }}%</p>
              </div>
              <div class="bg-slate-900/80 p-2 rounded-lg border border-white/5">
                <p class="text-[9px] text-slate-500 uppercase font-semibold">Region</p>
                <p class="font-bold text-indigo-300 truncate">{{ tw.region }}</p>
              </div>
            </div>

            <!-- Drill down action -->
            <button (click)="filterDashboardByTower(tw)"
                    class="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              Filter Studio by {{ tw.region }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes cablePulse {
      to {
        stroke-dashoffset: -40;
      }
    }
    .animated-fiber line {
      animation: cablePulse 6s linear infinite;
    }
  `]
})
export class GoogleMapComponent {
  id = input<string>('');
  props = input.required<any>();
  events = input<any[]>([]);

  private actionService = inject(A2UIActionService);
  private dashboardService = inject(DashboardService);

  mapTheme = signal<'dark' | 'satellite' | 'roadmap' | 'terrain'>('dark');
  showCoverage = signal<boolean>(true);
  showHeatmap = signal<boolean>(false);
  selectedZone = signal<string>('National');
  activeTower = signal<TowerMarker | null>(null);

  // Zoom & Pan
  zoomLevel = signal<number>(1);
  panX = signal<number>(0);
  panY = signal<number>(0);

  zones = [
    { name: 'National', zoom: 1, x: 0, y: 0 },
    { name: 'Kabul Metro', zoom: 1.8, x: -70, y: 20 },
    { name: 'Herat West', zoom: 1.8, x: 160, y: -40 },
    { name: 'Mazar North', zoom: 1.8, x: 0, y: 70 },
    { name: 'Kandahar South', zoom: 1.8, x: 60, y: -90 },
    { name: 'Jalalabad East', zoom: 1.8, x: -140, y: 0 }
  ];

  // Base Towers in Afghanistan
  towers: TowerMarker[] = [
    { id: 'TWR-KBL-01', name: 'KBL-01 Shahr-e Naw', region: 'Kabul', lat: 34.5355, lng: 69.1725, x: 420, y: 160, status: 'online', subscribers: 38450, throughputGbps: 18.4, slaPercent: 99.8, generation: '5G' },
    { id: 'TWR-KBL-02', name: 'KBL-02 Wazir Akbar', region: 'Kabul', lat: 34.5422, lng: 69.1894, x: 440, y: 155, status: 'online', subscribers: 42100, throughputGbps: 22.1, slaPercent: 99.9, generation: '5G' },
    { id: 'TWR-HRT-01', name: 'HRT-01 Herat Citadel', region: 'Herat', lat: 34.3529, lng: 62.2040, x: 180, y: 230, status: 'online', subscribers: 21400, throughputGbps: 9.8, slaPercent: 99.2, generation: '4G' },
    { id: 'TWR-HRT-02', name: 'HRT-02 Guzara Ind', region: 'Herat', lat: 34.2500, lng: 62.2200, x: 195, y: 245, status: 'maintenance', subscribers: 14200, throughputGbps: 5.6, slaPercent: 94.5, generation: '4G' },
    { id: 'TWR-MZR-01', name: 'MZR-01 Blue Mosque', region: 'Mazar-e-Sharif', lat: 36.7061, lng: 67.1123, x: 340, y: 130, status: 'online', subscribers: 29500, throughputGbps: 14.2, slaPercent: 99.5, generation: '5G' },
    { id: 'TWR-KDH-01', name: 'KDH-01 Ahmad Shah', region: 'Kandahar', lat: 31.6289, lng: 65.7372, x: 300, y: 320, status: 'alert', subscribers: 18600, throughputGbps: 7.1, slaPercent: 89.2, generation: '4G' },
    { id: 'TWR-JLD-01', name: 'JLD-01 Nangarhar', region: 'Jalalabad', lat: 34.4265, lng: 70.4515, x: 510, y: 170, status: 'online', subscribers: 23900, throughputGbps: 11.5, slaPercent: 98.7, generation: '4G' },
    { id: 'TWR-KDZ-01', name: 'KDZ-01 Kunduz Hub', region: 'Kunduz', lat: 36.7286, lng: 68.8570, x: 460, y: 115, status: 'online', subscribers: 12800, throughputGbps: 6.2, slaPercent: 97.9, generation: '3G' }
  ];

  selectZone(zone: any) {
    this.selectedZone.set(zone.name);
    this.zoomLevel.set(zone.zoom);
    this.panX.set(zone.x);
    this.panY.set(zone.y);
    this.activeTower.set(null);
  }

  zoomIn() {
    this.zoomLevel.update(z => Math.min(z + 0.3, 3));
  }

  zoomOut() {
    this.zoomLevel.update(z => Math.max(z - 0.3, 0.7));
  }

  resetView() {
    this.selectZone(this.zones[0]);
  }

  openInfoWindow(tower: TowerMarker) {
    this.activeTower.set(tower);
  }

  closeInfoWindow() {
    this.activeTower.set(null);
  }

  getCoverageRadius(gen: '5G' | '4G' | '3G'): number {
    if (gen === '5G') return 35;
    if (gen === '4G') return 60;
    return 90;
  }

  filterDashboardByTower(tower: TowerMarker) {
    this.actionService.handleAction({
      type: 'DRILL_DOWN',
      target: 'tower_detail',
      parameter: tower.region
    });
    this.closeInfoWindow();
  }
}
