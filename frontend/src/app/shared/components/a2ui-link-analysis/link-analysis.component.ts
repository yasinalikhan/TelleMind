import { Component, input, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A2UIActionService } from '../../../core/services/a2ui-action.service';

export interface GraphNode {
  id: string;
  label: string;
  type: 'subscriber' | 'tower' | 'gateway' | 'account' | 'suspect';
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  radius: number;
  riskScore: number;
  degree?: number;
  metadata?: Record<string, any>;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'call' | 'data' | 'transfer' | 'handoff';
  weight: number;
  label: string;
  highlighted?: boolean;
}

@Component({
  selector: 'a2ui-link-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-md flex flex-col h-full overflow-hidden">
      <!-- Link Analysis Header -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-white">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-white tracking-tight">{{ props().title || 'Telecom Link Analysis & Relationship Graph' }}</h3>
              <span class="rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-400 border border-purple-500/20 uppercase tracking-widest flex items-center gap-1">
                <span class="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                i2 / Palantir Engine
              </span>
            </div>
            <p class="text-xs text-slate-400">Subscriber CDR Calls, Tower Handoffs, Multi-hop Fraud Ring Tracing</p>
          </div>
        </div>

        <!-- Controls Toolbar -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Search Entity -->
          <div class="relative">
            <input type="text" [(ngModel)]="searchQuery" (input)="filterNodes()" placeholder="Search node or MSISDN..."
                   class="rounded-lg bg-slate-950/60 border border-white/10 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:outline-none w-44" />
          </div>

          <!-- Layout Mode Switcher -->
          <div class="flex rounded-lg bg-slate-950/60 p-1 border border-white/10 text-xs font-semibold">
            <button (click)="setLayout('force')" [class.bg-purple-600]="layoutMode() === 'force'" [class.text-white]="layoutMode() === 'force'"
                    class="px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Force</button>
            <button (click)="setLayout('radial')" [class.bg-purple-600]="layoutMode() === 'radial'" [class.text-white]="layoutMode() === 'radial'"
                    class="px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Radial</button>
            <button (click)="setLayout('grid')" [class.bg-purple-600]="layoutMode() === 'grid'" [class.text-white]="layoutMode() === 'grid'"
                    class="px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors">Grid</button>
          </div>

          <!-- Highlight Fraud Ring / Anomalies -->
          <button (click)="toggleFraudRing()"
                  [class.bg-rose-500/20]="fraudRingActive()" [class.text-rose-300]="fraudRingActive()" [class.border-rose-500/40]="fraudRingActive()"
                  class="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full" [class.bg-rose-500]="fraudRingActive()" [class.bg-slate-600]="!fraudRingActive()"></span>
            Fraud Ring Anomaly
          </button>

          <!-- Toggle Physics -->
          <button (click)="physicsRunning.update(v=>!v)"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-white/10 transition-colors">
            {{ physicsRunning() ? 'Pause Physics' : 'Resume Physics' }}
          </button>
        </div>
      </div>

      <!-- Graph Viewport & Canvas Area -->
      <div class="relative flex-1 w-full min-h-[380px] rounded-xl overflow-hidden border border-white/10 bg-[#090d1f] select-none flex">
        
        <!-- Network SVG Canvas -->
        <svg class="w-full h-full cursor-grab active:cursor-grabbing" (mousedown)="onCanvasMouseDown($event)" (mousemove)="onCanvasMouseMove($event)" (mouseup)="onCanvasMouseUp()">
          <!-- Grid Background -->
          <defs>
            <pattern id="linkGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.8" fill="rgba(255,255,255,0.08)" />
            </pattern>
            <!-- Marker Arrows for Directed Links -->
            <marker id="arrow-call" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
            </marker>
            <marker id="arrow-transfer" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
            </marker>
          </defs>

          <rect width="100%" height="100%" fill="url(#linkGrid)" />

          <!-- Links / Edges -->
          @for (link of links(); track link.id) {
            @let src = getNode(link.source);
            @let tgt = getNode(link.target);
            @if (src && tgt) {
              <g class="transition-all">
                <!-- Link Line -->
                <line [attr.x1]="src.x" [attr.y1]="src.y" [attr.x2]="tgt.x" [attr.y2]="tgt.y"
                      [attr.stroke]="getLinkColor(link)"
                      [attr.stroke-width]="getLinkWidth(link)"
                      [attr.stroke-opacity]="getLinkOpacity(link)"
                      [attr.stroke-dasharray]="link.type === 'handoff' ? '4 4' : 'none'"
                      [attr.marker-end]="link.type === 'transfer' ? 'url(#arrow-transfer)' : 'url(#arrow-call)'" />
                
                <!-- Link Midpoint Weight Badge -->
                @if (link.highlighted || fraudRingActive()) {
                  <rect [attr.x]="(src.x + tgt.x)/2 - 18" [attr.y]="(src.y + tgt.y)/2 - 8" width="36" height="16" rx="4"
                        fill="#0f172a" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
                  <text [attr.x]="(src.x + tgt.x)/2" [attr.y]="(src.y + tgt.y)/2 + 3" text-anchor="middle"
                        class="fill-cyan-300 text-[8.5px] font-bold font-mono">{{ link.label }}</text>
                }
              </g>
            }
          }

          <!-- Nodes -->
          @for (node of nodes(); track node.id) {
            <g class="cursor-pointer group" (mousedown)="startDragNode($event, node)" (click)="selectNode(node)">
              <!-- Ring for Selected or Highlighted Node -->
              @if (selectedNode()?.id === node.id || isNodeHighlighted(node)) {
                <circle [attr.cx]="node.x" [attr.cy]="node.y" [attr.r]="node.radius + 8"
                        fill="none" [attr.stroke]="node.riskScore > 70 ? '#f43f5e' : '#818cf8'" stroke-width="2" stroke-dasharray="4 2"
                        class="animate-spin origin-center" [style.transform-origin]="node.x + 'px ' + node.y + 'px'" />
              }

              <!-- Pulsing beacon for high risk / suspect nodes -->
              @if (node.type === 'suspect' || node.riskScore > 75) {
                <circle [attr.cx]="node.x" [attr.cy]="node.y" [attr.r]="node.radius + 6"
                        fill="#f43f5e" opacity="0.3" class="animate-ping" />
              }

              <!-- Core Node Circle -->
              <circle [attr.cx]="node.x" [attr.cy]="node.y" [attr.r]="node.radius"
                      [attr.fill]="getNodeColor(node)"
                      stroke="#ffffff" stroke-width="1.8"
                      class="transition-all duration-200 group-hover:scale-110" />

              <!-- Node Icon Label -->
              <text [attr.x]="node.x" [attr.y]="node.y + 4" text-anchor="middle" class="fill-white text-[10px] font-black pointer-events-none">
                {{ getNodeIconText(node.type) }}
              </text>

              <!-- Node Label Below -->
              <text [attr.x]="node.x" [attr.y]="node.y + node.radius + 12" text-anchor="middle"
                    class="fill-slate-300 text-[10px] font-semibold group-hover:fill-white drop-shadow pointer-events-none">
                {{ node.label }}
              </text>
            </g>
          }
        </svg>

        <!-- Node Inspector Slide-over Drawer (Right Side) -->
        @if (selectedNode(); as sel) {
          <div class="absolute right-3 top-3 bottom-3 w-80 rounded-xl bg-slate-950/95 border border-purple-500/40 p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-between z-20 animate-in slide-in-from-right duration-200">
            <div>
              <div class="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <div class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full" [style.background-color]="getNodeColor(sel)"></span>
                  <h4 class="text-sm font-bold text-white truncate">{{ sel.label }}</h4>
                </div>
                <button (click)="selectedNode.set(null)" class="text-slate-400 hover:text-white p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              <!-- Risk Badge -->
              <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5 mb-3">
                <span class="text-xs text-slate-400">Risk Centrality Score:</span>
                <span class="text-xs font-bold font-mono px-2 py-0.5 rounded"
                      [class.bg-rose-500/20]="sel.riskScore > 70" [class.text-rose-400]="sel.riskScore > 70"
                      [class.bg-emerald-500/20]="sel.riskScore <= 70" [class.text-emerald-400]="sel.riskScore <= 70">
                  {{ sel.riskScore }}/100 {{ sel.riskScore > 70 ? 'CRITICAL RISK' : 'NORMAL' }}
                </span>
              </div>

              <!-- Entity Attributes Grid -->
              <div class="grid grid-cols-2 gap-2 text-xs mb-4">
                <div class="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  <span class="text-[9px] text-slate-500 uppercase font-semibold">Entity Type</span>
                  <p class="font-bold text-white capitalize">{{ sel.type }}</p>
                </div>
                <div class="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  <span class="text-[9px] text-slate-500 uppercase font-semibold">Degree Links</span>
                  <p class="font-bold text-cyan-400 font-mono">{{ getConnectedLinks(sel.id).length }} Connections</p>
                </div>
                <div class="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  <span class="text-[9px] text-slate-500 uppercase font-semibold">Inbound Calls</span>
                  <p class="font-bold text-emerald-400 font-mono">142 Calls</p>
                </div>
                <div class="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                  <span class="text-[9px] text-slate-500 uppercase font-semibold">Volume Handled</span>
                  <p class="font-bold text-purple-400 font-mono">48.2 GB</p>
                </div>
              </div>

              <!-- Connected Entities List -->
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Connected Entities</p>
              <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                @for (conn of getConnectedLinks(sel.id); track conn.id) {
                  @let otherId = conn.source === sel.id ? conn.target : conn.source;
                  @let otherNode = getNode(otherId);
                  @if (otherNode) {
                    <div (click)="selectNode(otherNode)"
                         class="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800 border border-white/5 cursor-pointer text-xs transition-colors">
                      <div class="flex items-center gap-2">
                        <span class="h-2 w-2 rounded-full" [style.background-color]="getNodeColor(otherNode)"></span>
                        <span class="font-semibold text-slate-300 truncate w-32">{{ otherNode.label }}</span>
                      </div>
                      <span class="font-mono text-[10px] text-cyan-400 font-bold">{{ conn.label }}</span>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Path Trace & Action Buttons -->
            <div class="pt-3 border-t border-white/10 space-y-2">
              <button (click)="traceShortestPath(sel)"
                      class="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                Trace Path to Gateway
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class LinkAnalysisComponent implements OnInit, OnDestroy {
  id = input<string>('');
  props = input.required<any>();
  events = input<any[]>([]);

  private actionService = inject(A2UIActionService);

  searchQuery = '';
  layoutMode = signal<'force' | 'radial' | 'grid'>('force');
  physicsRunning = signal<boolean>(true);
  fraudRingActive = signal<boolean>(false);
  selectedNode = signal<GraphNode | null>(null);

  private dragNode: GraphNode | null = null;
  private animationFrameId: any = null;

  // Master Network Data
  private rawNodes: GraphNode[] = [
    { id: 'sub_1', label: '+93799000101 (Kabul VIP)', type: 'subscriber', x: 260, y: 150, radius: 18, riskScore: 25 },
    { id: 'sub_2', label: '+93799000102 (Kabul User)', type: 'subscriber', x: 180, y: 220, radius: 14, riskScore: 15 },
    { id: 'sub_3', label: '+93799000103 (Herat Trader)', type: 'subscriber', x: 380, y: 180, radius: 16, riskScore: 30 },
    { id: 'suspect_1', label: '+93799000999 (Suspect Alert)', type: 'suspect', x: 480, y: 130, radius: 20, riskScore: 92 },
    { id: 'suspect_2', label: '+93700112233 (Mule Phone)', type: 'suspect', x: 550, y: 210, radius: 17, riskScore: 88 },
    { id: 'twr_kbl', label: 'Tower KBL-01', type: 'tower', x: 220, y: 100, radius: 22, riskScore: 10 },
    { id: 'twr_hrt', label: 'Tower HRT-01', type: 'tower', x: 340, y: 280, radius: 22, riskScore: 10 },
    { id: 'gw_core', label: 'Kabul Core Gateway IP', type: 'gateway', x: 350, y: 80, radius: 24, riskScore: 5 },
    { id: 'acc_1', label: 'Mobile Wallet #8812', type: 'account', x: 440, y: 260, radius: 16, riskScore: 85 }
  ];

  private rawLinks: GraphLink[] = [
    { id: 'l1', source: 'sub_1', target: 'twr_kbl', type: 'call', weight: 45, label: '45m Call' },
    { id: 'l2', source: 'sub_2', target: 'twr_kbl', type: 'call', weight: 12, label: '12m Call' },
    { id: 'l3', source: 'twr_kbl', target: 'gw_core', type: 'handoff', weight: 120, label: 'Fiber Link' },
    { id: 'l4', source: 'gw_core', target: 'sub_3', type: 'data', weight: 80, label: '4.8 GB' },
    { id: 'l5', source: 'sub_3', target: 'twr_hrt', type: 'call', weight: 35, label: '35m Call' },
    { id: 'l6', source: 'suspect_1', target: 'suspect_2', type: 'transfer', weight: 95, label: '$4,500 Cash' },
    { id: 'l7', source: 'suspect_2', target: 'acc_1', type: 'transfer', weight: 90, label: '$4,000 Wire' },
    { id: 'l8', source: 'acc_1', target: 'suspect_1', type: 'transfer', weight: 85, label: '$3,800 Flow' },
    { id: 'l9', source: 'suspect_1', target: 'sub_3', type: 'call', weight: 28, label: 'Burner SMS' }
  ];

  nodes = signal<GraphNode[]>(this.rawNodes);
  links = signal<GraphLink[]>(this.rawLinks);

  ngOnInit() {
    this.startPhysicsLoop();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startPhysicsLoop() {
    const tick = () => {
      if (this.physicsRunning() && this.layoutMode() === 'force') {
        this.stepPhysics();
      }
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stepPhysics() {
    const currentNodes = [...this.nodes()];
    const currentLinks = this.links();

    // 1. Center attraction
    const cx = 350;
    const cy = 200;
    for (const node of currentNodes) {
      if (node === this.dragNode) continue;
      const dx = cx - node.x;
      const dy = cy - node.y;
      node.x += dx * 0.005;
      node.y += dy * 0.005;
    }

    // 2. Node-node repulsion
    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = i + 1; j < currentNodes.length; j++) {
        const n1 = currentNodes[i];
        const n2 = currentNodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 180) {
          const force = (180 - dist) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (n1 !== this.dragNode) { n1.x -= fx; n1.y -= fy; }
          if (n2 !== this.dragNode) { n2.x += fx; n2.y += fy; }
        }
      }
    }

    // 3. Link spring tension
    for (const link of currentLinks) {
      const src = currentNodes.find(n => n.id === link.source);
      const tgt = currentNodes.find(n => n.id === link.target);
      if (src && tgt) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = 120;
        const delta = (dist - desiredDist) * 0.02;
        const fx = (dx / dist) * delta;
        const fy = (dy / dist) * delta;
        if (src !== this.dragNode) { src.x += fx; src.y += fy; }
        if (tgt !== this.dragNode) { tgt.x -= fx; tgt.y -= fy; }
      }
    }

    this.nodes.set(currentNodes);
  }

  setLayout(mode: 'force' | 'radial' | 'grid') {
    this.layoutMode.set(mode);
    const updated = [...this.nodes()];
    const count = updated.length;

    if (mode === 'radial') {
      const cx = 350;
      const cy = 200;
      const r = 160;
      updated.forEach((node, idx) => {
        const angle = (idx / count) * 2 * Math.PI;
        node.x = cx + r * Math.cos(angle);
        node.y = cy + r * Math.sin(angle);
      });
    } else if (mode === 'grid') {
      const cols = 3;
      updated.forEach((node, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        node.x = 180 + col * 170;
        node.y = 80 + row * 120;
      });
    }
    this.nodes.set(updated);
  }

  toggleFraudRing() {
    this.fraudRingActive.update(v => !v);
    const active = this.fraudRingActive();
    const updatedLinks = this.links().map(l => {
      const isRing = (l.source === 'suspect_1' || l.source === 'suspect_2' || l.source === 'acc_1') &&
                     (l.target === 'suspect_1' || l.target === 'suspect_2' || l.target === 'acc_1');
      return { ...l, highlighted: active ? isRing : false };
    });
    this.links.set(updatedLinks);
  }

  traceShortestPath(fromNode: GraphNode) {
    const targetId = 'gw_core';
    const updatedLinks = this.links().map(l => {
      const onPath = (l.source === fromNode.id || l.target === fromNode.id || l.target === targetId || l.source === targetId);
      return { ...l, highlighted: onPath };
    });
    this.links.set(updatedLinks);
  }

  filterNodes() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.nodes.set(this.rawNodes);
      return;
    }
    const matched = this.rawNodes.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
    this.nodes.set(matched);
  }

  selectNode(node: GraphNode) {
    this.selectedNode.set(node);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes().find(n => n.id === id);
  }

  getConnectedLinks(nodeId: string): GraphLink[] {
    return this.links().filter(l => l.source === nodeId || l.target === nodeId);
  }

  isNodeHighlighted(node: GraphNode): boolean {
    if (this.fraudRingActive() && (node.id === 'suspect_1' || node.id === 'suspect_2' || node.id === 'acc_1')) {
      return true;
    }
    return false;
  }

  getNodeColor(node: GraphNode): string {
    if (node.type === 'suspect') return '#f43f5e';
    if (node.type === 'tower') return '#06b6d4';
    if (node.type === 'gateway') return '#6366f1';
    if (node.type === 'account') return '#f59e0b';
    return '#10b981';
  }

  getNodeIconText(type: string): string {
    if (type === 'suspect') return '⚠';
    if (type === 'tower') return '📡';
    if (type === 'gateway') return '🌐';
    if (type === 'account') return '💳';
    return '📱';
  }

  getLinkColor(link: GraphLink): string {
    if (link.highlighted) return '#f43f5e';
    if (link.type === 'transfer') return '#f59e0b';
    if (link.type === 'data') return '#06b6d4';
    if (link.type === 'handoff') return '#a855f7';
    return '#6366f1';
  }

  getLinkWidth(link: GraphLink): number {
    if (link.highlighted) return 3.5;
    return Math.min(Math.max(link.weight / 25, 1.5), 3);
  }

  getLinkOpacity(link: GraphLink): number {
    if (link.highlighted) return 1.0;
    return 0.45;
  }

  startDragNode(event: MouseEvent, node: GraphNode) {
    this.dragNode = node;
  }

  onCanvasMouseDown(event: MouseEvent) {
    // Canvas interaction
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.dragNode) {
      const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
      this.dragNode.x = event.clientX - rect.left;
      this.dragNode.y = event.clientY - rect.top;
    }
  }

  onCanvasMouseUp() {
    this.dragNode = null;
  }
}
