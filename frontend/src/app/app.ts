import { Component, OnInit, inject, signal, effect, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardConfig } from './core/services/dashboard.service';
import { AiService } from './core/services/ai.service';
import { A2UIRegistryService } from './core/services/a2ui-registry.service';
import { A2UIValidationService } from './core/services/a2ui-validation.service';
import { A2UIActionService } from './core/services/a2ui-action.service';
import { A2UIResponse, A2UIComponent } from './core/models/a2ui.model';
import { DatasetService, CustomDataset } from './core/services/dataset.service';
import { ChartComponent } from './shared/components/a2ui-chart/chart.component';
import { GoogleMapComponent } from './shared/components/a2ui-google-map/google-map.component';
import { LinkAnalysisComponent } from './shared/components/a2ui-link-analysis/link-analysis.component';
import { TableComponent } from './shared/components/a2ui-table/table.component';
import { KpiComponent } from './shared/components/a2ui-kpi/kpi.component';
import { MapComponent } from './shared/components/a2ui-map/map.component';

export type StudioTab = 'canvas' | 'visual_gallery' | 'google_maps' | 'link_analysis' | 'data_hub' | 'ai_copilot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartComponent,
    GoogleMapComponent,
    LinkAnalysisComponent,
    TableComponent,
    KpiComponent,
    MapComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly dashboardService = inject(DashboardService);
  private readonly aiService = inject(AiService);
  private readonly registry = inject(A2UIRegistryService);
  private readonly validator = inject(A2UIValidationService);
  private readonly actionService = inject(A2UIActionService);
  private readonly datasetService = inject(DatasetService);

  constructor() {
    effect(() => {
      const list = this.dashboardService.dashboards();
      if (list.length > 0 && !this.dashboardService.activeDashboard()) {
        setTimeout(() => {
          if (this.dashboardService.dashboards().length > 0 && !this.dashboardService.activeDashboard()) {
            this.selectDashboard(this.dashboardService.dashboards()[0]);
          }
        });
      }
    });
  }

  // Active Functionality Studio Tab
  activeStudioTab = signal<StudioTab>('canvas');

  // Presentation & Fullscreen Mode
  presentationMode = signal<boolean>(false);

  // Authentication State
  username = signal('admin');
  password = signal('admin123');
  selectedTenant = signal(localStorage.getItem('tenantId') || 'tenant_1');

  // Natural Language & AI Signals
  queryText = signal('');
  showSql = signal(false);
  lastQueryResponse = signal<A2UIResponse | null>(null);

  // Workspace CRUD & Menu Signals
  newDashboardName = signal('');
  workspaceMenuOpen = signal<boolean>(false);
  hasUnsavedChanges = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showSaveAsModal = signal<boolean>(false);
  saveAsName = signal<string>('');
  toastMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  private toastTimeout: any = null;

  // Add Widget Modal
  showAddWidgetModal = signal<boolean>(false);
  galleryCategory = signal<string>('all');

  // Drag and Drop tracking variables
  draggedIndex: number | null = null;
  dragOverIndex = signal<number | null>(null);

  // Custom Datasets signals
  datasets = signal<CustomDataset[]>([]);
  activePreviewDataset = signal<CustomDataset | null>(null);
  activePreviewSchema = signal<Record<string, string>>({});
  previewRows = signal<any[]>([]);
  previewColumns = signal<string[]>([]);
  rawSqlConsoleInput = signal<string>('SELECT msisdn, region, plan, status, recharge_amount FROM subscriber ORDER BY recharge_amount DESC LIMIT 20;');

  // Sidebar collapsible section states
  workspaceOpen = signal(true);
  datasetsOpen = signal(true);
  aiOpen = signal(true);
  templatesOpen = signal(false);
  showNewWorkspace = signal(false);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.onSaveWorkspaceFromMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && !target.closest('#workspace-menu-button') && !target.closest('#workspace-menu-dropdown')) {
      this.workspaceMenuOpen.set(false);
    }
  }

  suggestions = [
    'Show revenue trend for last 30 days',
    'Show top 10 subscribers by recharge amount',
    'Compare data usage by region',
    'Show inactive subscribers',
    'Display network usage on map',
    'Display google map base stations',
    'Show link analysis caller network'
  ];

  // 20+ Top BI Charts Catalog Definition for the Gallery
  topBiCharts = [
    { type: 'line', name: 'Line Trend Spline', category: 'trend', icon: '📈', desc: 'Continuous time-series revenue and data traffic trajectory with gradient fill.', sampleProps: { chartType: 'line', title: 'Daily Revenue Run-Rate', xAxis: 'date', yAxis: 'amount', data: this.generateSampleTrend() } },
    { type: 'bar', name: 'Vertical Column Bar', category: 'compare', icon: '📊', desc: 'Categorical distribution and regional capacity comparison.', sampleProps: { chartType: 'bar', title: 'Regional Revenue Comparison', xAxis: 'region', yAxis: 'amount', data: this.generateSampleRegions() } },
    { type: 'horizontal_bar', name: 'Horizontal Leaderboard', category: 'compare', icon: '🏆', desc: 'Top subscriber rankings, high-value recharges, and quota utilization.', sampleProps: { chartType: 'horizontal_bar', title: 'Top Regional Leaderboard', xAxis: 'region', yAxis: 'amount', data: this.generateSampleRegions() } },
    { type: 'stacked_bar', name: 'Stacked Multi-Metric Bar', category: 'compare', icon: '📶', desc: 'Data, Voice, and SMS breakdown per provincial node.', sampleProps: { chartType: 'stacked_bar', title: 'Traffic Mix by Province', xAxis: 'region', data: this.generateSampleUsage() } },
    { type: 'pie', name: 'Categorical Pie Chart', category: 'share', icon: '🥧', desc: 'Subscriber tariff plan distribution and market share.', sampleProps: { chartType: 'pie', title: 'Tariff Plan Share', labelKey: 'plan', valueKey: 'count', data: this.generateSamplePlans() } },
    { type: 'donut', name: 'Donut with Center KPI', category: 'share', icon: '🍩', desc: 'Composition analysis with aggregate total callout.', sampleProps: { chartType: 'donut', title: 'Subscription Composition', labelKey: 'plan', valueKey: 'count', data: this.generateSamplePlans() } },
    { type: 'area', name: 'Area Trend Stream', category: 'trend', icon: '🌊', desc: 'Cumulative volume under the curve for network capacity growth.', sampleProps: { chartType: 'area', title: 'Throughput Volume Growth', xAxis: 'date', yAxis: 'amount', data: this.generateSampleTrend() } },
    { type: 'stacked_area', name: 'Stacked Area Multi-Layer', category: 'trend', icon: '📉', desc: 'Multi-layer cumulative traffic contribution over time.', sampleProps: { chartType: 'stacked_area', title: '4G vs 5G Traffic Trajectory', data: this.generateSampleTrend() } },
    { type: 'scatter', name: '2D Correlation Scatter Plot', category: 'dist', icon: '⁖', desc: 'Identify correlation between recharge amount and data consumption.', sampleProps: { chartType: 'scatter', title: 'Recharge vs Usage Correlation', xAxis: 'recharge_amount', yAxis: 'amount', data: this.generateSampleScatter() } },
    { type: 'bubble', name: '3-Metric Bubble Chart', category: 'dist', icon: '🫧', desc: 'Visualize 3 dimensions simultaneously (X: Volume, Y: Cost, Bubble Size: MSISDNs).', sampleProps: { chartType: 'bubble', title: '3D Node Multi-Variable Analysis', data: this.generateSampleRegions() } },
    { type: 'heatmap', name: '2D Intensity Matrix Heatmap', category: 'dist', icon: '🔥', desc: 'Network congestion matrix by hour-of-day and cell tower.', sampleProps: { chartType: 'heatmap', title: 'Tower Traffic Heatmap', data: this.generateSampleUsage() } },
    { type: 'gauge', name: 'Radial SLA Speedometer', category: 'kpi', icon: '⏱', desc: 'Real-time performance KPI target index and uptime percentage.', sampleProps: { chartType: 'gauge', title: 'Core SLA Health Target', valueKey: 'value', data: [{ value: 94.6 }] } },
    { type: 'radar', name: 'Radar / Spider Chart', category: 'compare', icon: '🕸', desc: 'Multi-axial assessment across Coverage, Throughput, Latency, and SLA.', sampleProps: { chartType: 'radar', title: 'Network Operational Radar Profile', data: [] } },
    { type: 'treemap', name: 'Treemap Market Composition', category: 'share', icon: '🗂', desc: 'Hierarchical nested rectangles scaled by subscriber revenue.', sampleProps: { chartType: 'treemap', title: 'Revenue Share Treemap', data: this.generateSampleRegions() } },
    { type: 'funnel', name: 'Conversion Funnel', category: 'flow', icon: '⏳', desc: 'Onboarding pipeline and subscriber retention drop-off.', sampleProps: { chartType: 'funnel', title: 'Customer Acquisition Funnel', data: [] } },
    { type: 'waterfall', name: 'Financial Variance Waterfall', category: 'flow', icon: '🪜', desc: 'Bridge between starting revenue, positive gains, and negative churn.', sampleProps: { chartType: 'waterfall', title: 'Revenue Walk & Variance Walk', data: [] } },
    { type: 'boxplot', name: 'Box & Whisker Quartile Plot', category: 'dist', icon: '📦', desc: 'Quartile distribution, median latency, and regional outliers.', sampleProps: { chartType: 'boxplot', title: 'Data Speed Distribution', data: [] } },
    { type: 'bullet', name: 'Performance Bullet Benchmark', category: 'kpi', icon: '🎯', desc: 'Actual vs Target against qualitative poor/satisfactory/good bands.', sampleProps: { chartType: 'bullet', title: 'Throughput Target Bullet Index', data: [] } },
    { type: 'candlestick', name: 'Candlestick (OHLC) Volatility', category: 'dist', icon: '🕯', desc: 'Peak usage volatility showing Open, High, Low, and Close points.', sampleProps: { chartType: 'candlestick', title: 'Hourly Bandwidth Volatility', data: [] } },
    { type: 'polar', name: 'Polar / Coxcomb Rose Chart', category: 'share', icon: '🌹', desc: 'Cyclical usage patterns with radius proportional to volume.', sampleProps: { chartType: 'polar', title: 'Tower Directional Polar Load', data: [] } },
    { type: 'sankey', name: 'Sankey Multi-Hop Flow', category: 'flow', icon: '🔀', desc: 'Traffic flow routes transitioning from access towers to corporate cloud.', sampleProps: { chartType: 'sankey', title: 'Network Routing Sankey Flow', data: [] } },
    { type: 'sparkline', name: 'Scorecard with Mini Sparkline', category: 'kpi', icon: '⚡', desc: 'High-impact metric card with 7-day trend sparkline.', sampleProps: { chartType: 'sparkline', title: 'Weekly Revenue Velocity', data: [] } },
    { type: 'chord', name: 'Chord Dependency Matrix', category: 'flow', icon: '⭕', desc: 'Bilateral communication volume exchanged between provincial hubs.', sampleProps: { chartType: 'chord', title: 'Provincial Interconnect Chord', data: [] } }
  ];

  filteredGalleryCharts = computed(() => {
    const cat = this.galleryCategory();
    if (cat === 'all') return this.topBiCharts;
    return this.topBiCharts.filter(c => c.category === cat);
  });

  ngOnInit() {
    this.actionService.pageUpdates$.subscribe((newPage) => {
      try {
        const validated = this.validator.validateResponse(newPage);
        this.dashboardService.activePage.set(validated);
      } catch (err: any) {
        console.error('Drill down schema mismatch:', err);
        this.dashboardService.error.set(`Schema Error: ${err.message}`);
      }
    });

    if (this.dashboardService.token()) {
      this.dashboardService.loadDashboards();
      this.loadDatasets();
      this.runQuery(this.suggestions[0]);
    }
  }

  getComponentType(type: string) {
    return this.registry.getComponentType(type);
  }

  setStudioTab(tab: StudioTab) {
    this.activeStudioTab.set(tab);
  }

  togglePresentationMode() {
    this.presentationMode.update(v => !v);
  }

  onLogin() {
    this.dashboardService.login(this.username(), this.password(), this.selectedTenant());
    setTimeout(() => {
      if (this.dashboardService.token()) {
        this.dashboardService.loadDashboards();
        this.loadDatasets();
        this.runQuery(this.suggestions[0]);
      }
    }, 1000);
  }

  onLogout() {
    this.dashboardService.logout();
    this.datasets.set([]);
    this.activePreviewDataset.set(null);
  }

  onSubmitQuery() {
    const q = this.queryText().trim();
    if (!q) return;
    this.runQuery(q);
  }

  toggleSqlView() {
    this.showSql.update(v => !v);
  }

  runQuery(text: string) {
    this.queryText.set(text);
    this.showSql.set(false);
    this.dashboardService.localFilters.set({});
    this.dashboardService.loading.set(true);
    this.dashboardService.error.set(null);

    this.aiService.postQuery(text).subscribe({
      next: (response) => {
        try {
          const validated = this.validator.validateResponse(response);
          this.dashboardService.activePage.set(validated);
          this.lastQueryResponse.set(validated);
          this.dashboardService.loading.set(false);
        } catch (e: any) {
          console.error('Validation failure:', e);
          this.dashboardService.error.set(`Schema Error: ${e.message}`);
          this.dashboardService.loading.set(false);
        }
      },
      error: (err) => {
        console.error('API query failure:', err);
        this.dashboardService.error.set(err.error?.error || 'Connection to analytics engine failed.');
        this.dashboardService.loading.set(false);
      }
    });
  }

  switchTenant(tenant: string) {
    this.selectedTenant.set(tenant);
    localStorage.setItem('tenantId', tenant);
    this.dashboardService.tenantId.set(tenant);
    this.dashboardService.activeDashboard.set(null);
    this.dashboardService.loadDashboards();
    this.loadDatasets();
    this.runQuery(this.queryText() || this.suggestions[0]);
  }

  loadDatasets() {
    this.datasetService.getDatasets().subscribe({
      next: (data) => this.datasets.set(data),
      error: (err) => console.error('Failed to load datasets', err)
    });
  }

  onCsvUpload(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.dashboardService.loading.set(true);
    this.datasetService.uploadDataset(file).subscribe({
      next: (ds) => {
        this.dashboardService.loading.set(false);
        this.loadDatasets();
        this.showToast('success', `Dataset "${ds.tableName}" uploaded successfully!`);
        event.target.value = '';
      },
      error: (err) => {
        this.dashboardService.loading.set(false);
        console.error('Upload failed:', err);
        this.dashboardService.error.set(err.error?.error || 'CSV upload failed.');
        event.target.value = '';
      }
    });
  }

  previewDataset(ds: CustomDataset) {
    this.datasetService.getDatasetPreview(ds.id).subscribe({
      next: (res) => {
        this.activePreviewDataset.set(res.dataset);
        this.previewRows.set(res.preview);
        
        try {
          this.activePreviewSchema.set(JSON.parse(res.dataset.schemaJson));
        } catch (e) {
          this.activePreviewSchema.set({});
        }

        if (res.preview.length > 0) {
          this.previewColumns.set(Object.keys(res.preview[0]));
        } else {
          try {
            const schema = JSON.parse(res.dataset.schemaJson);
            this.previewColumns.set(Object.keys(schema));
          } catch (e) {
            this.previewColumns.set([]);
          }
        }
        this.activeStudioTab.set('data_hub');
      },
      error: (err) => {
        console.error('Failed to get preview', err);
        this.dashboardService.error.set(err.error?.error || 'Failed to load dataset preview.');
      }
    });
  }

  deleteDataset(ds: CustomDataset, event: MouseEvent) {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete dataset "${ds.tableName}"?`)) return;

    this.datasetService.deleteDataset(ds.id).subscribe({
      next: () => {
        if (this.activePreviewDataset()?.id === ds.id) {
          this.activePreviewDataset.set(null);
        }
        this.loadDatasets();
        this.showToast('info', `Dataset "${ds.tableName}" deleted.`);
      },
      error: (err) => {
        console.error('Deletion failed:', err);
        this.dashboardService.error.set(err.error?.error || 'Dataset deletion failed.');
      }
    });
  }

  closePreview() {
    this.activePreviewDataset.set(null);
  }

  // Workspace Actions
  toggleWorkspaceMenu(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.workspaceMenuOpen.update(v => !v);
  }

  closeWorkspaceMenu() {
    this.workspaceMenuOpen.set(false);
  }

  showToast(type: 'success' | 'error' | 'info', text: string) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage.set({ type, text });
    this.toastTimeout = setTimeout(() => this.toastMessage.set(null), 3500);
  }

  onSaveWorkspaceFromMenu() {
    this.closeWorkspaceMenu();
    const activeDb = this.dashboardService.activeDashboard();
    if (activeDb && activeDb.id) {
      this.saveWorkspace();
    } else {
      this.openSaveAsModal();
    }
  }

  openSaveAsModal() {
    this.closeWorkspaceMenu();
    const activeDb = this.dashboardService.activeDashboard();
    const activePage = this.dashboardService.activePage();
    const defaultName = activeDb?.name || activePage?.page?.title || 'New Workspace';
    this.saveAsName.set(defaultName);
    this.showSaveAsModal.set(true);
  }

  closeSaveAsModal() {
    this.showSaveAsModal.set(false);
    this.saveAsName.set('');
  }

  confirmSaveAs() {
    const name = this.saveAsName().trim();
    if (!name) return;

    const page = this.dashboardService.activePage();
    const components = page ? page.page.components : [];
    const layoutStr = JSON.stringify(components);

    this.isSaving.set(true);
    this.dashboardService.saveWorkspace(name, layoutStr).subscribe({
      next: (savedDb) => {
        this.isSaving.set(false);
        this.closeSaveAsModal();
        this.hasUnsavedChanges.set(false);
        this.dashboardService.loadDashboards();
        this.selectDashboard(savedDb);
        this.showToast('success', `Workspace "${savedDb.name}" saved to database!`);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to save workspace:', err);
        this.showToast('error', err.error?.error || 'Failed to save workspace.');
      }
    });
  }

  reloadWorkspaceFromDb() {
    const activeDb = this.dashboardService.activeDashboard();
    if (!activeDb || !activeDb.id) return;
    this.dashboardService.loadDashboards();
    this.selectDashboard(activeDb);
    this.hasUnsavedChanges.set(false);
    this.showToast('success', `Workspace "${activeDb.name}" reloaded.`);
  }

  selectDashboard(db: DashboardConfig | null) {
    this.dashboardService.activeDashboard.set(db);
    this.dashboardService.editMode.set(false);
    this.lastQueryResponse.set(null);
    this.hasUnsavedChanges.set(false);
    this.workspaceMenuOpen.set(false);

    if (!db) {
      this.dashboardService.activePage.set(null);
      return;
    }

    try {
      const components = JSON.parse(db.layoutConfig) as A2UIComponent[];
      const pageResponse: A2UIResponse = {
        version: '1.0.0',
        page: {
          title: db.name,
          layout: 'grid',
          components: components
        },
        actions: []
      };
      this.dashboardService.activePage.set(pageResponse);
    } catch (e) {
      console.error('Failed to parse dashboard layout:', e);
      this.dashboardService.error.set('Failed to parse dashboard configuration.');
    }
  }

  createWorkspace() {
    const name = this.newDashboardName().trim();
    if (!name) return;

    this.isSaving.set(true);
    this.dashboardService.createDashboard(name).subscribe({
      next: (newDb) => {
        this.isSaving.set(false);
        this.newDashboardName.set('');
        this.dashboardService.loadDashboards();
        this.showToast('success', `Workspace "${newDb.name}" created!`);
        setTimeout(() => this.selectDashboard(newDb), 300);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to create dashboard:', err);
        this.showToast('error', 'Failed to create workspace.');
      }
    });
  }

  saveWorkspace() {
    const db = this.dashboardService.activeDashboard();
    const page = this.dashboardService.activePage();
    if (!db || !db.id) {
      this.openSaveAsModal();
      return;
    }

    const components = page ? page.page.components : [];
    const layoutStr = JSON.stringify(components);

    this.isSaving.set(true);
    this.dashboardService.saveWorkspace(db.name, layoutStr, db.id).subscribe({
      next: (updatedDb) => {
        this.isSaving.set(false);
        this.hasUnsavedChanges.set(false);
        this.dashboardService.editMode.set(false);
        this.dashboardService.loadDashboards();
        this.dashboardService.activeDashboard.set(updatedDb);
        this.showToast('success', `Workspace "${updatedDb.name}" saved!`);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to save dashboard:', err);
        this.showToast('error', err.error?.error || 'Failed to save workspace.');
      }
    });
  }

  deleteWorkspace() {
    const db = this.dashboardService.activeDashboard();
    if (!db || !db.id) return;

    if (!confirm(`Are you sure you want to delete dashboard "${db.name}"?`)) return;

    this.dashboardService.deleteDashboard(db.id).subscribe({
      next: () => {
        this.selectDashboard(null);
        this.dashboardService.loadDashboards();
        this.showToast('info', 'Workspace deleted.');
      },
      error: (err) => {
        console.error('Failed to delete dashboard:', err);
      }
    });
  }

  toggleEditMode() {
    this.dashboardService.editMode.update(v => !v);
  }

  // 1-Click Add Any Component to the Active Workspace
  addChartFromGallery(chartDef: any) {
    const newComp: A2UIComponent = {
      id: `widget_${chartDef.type}_${Date.now()}`,
      type: 'chart',
      props: {
        ...chartDef.sampleProps,
        colSpan: 6
      }
    };
    this.appendComponentToWorkspace(newComp);
    this.showToast('success', `Added "${chartDef.name}" to your workspace!`);
    this.activeStudioTab.set('canvas');
  }

  addGoogleMapToWorkspace() {
    const newComp: A2UIComponent = {
      id: `widget_google_map_${Date.now()}`,
      type: 'google-map',
      props: {
        title: 'Google Maps Telecom Geospatial Center',
        colSpan: 12
      }
    };
    this.appendComponentToWorkspace(newComp);
    this.showToast('success', 'Google Map added to your active workspace!');
    this.activeStudioTab.set('canvas');
  }

  addLinkAnalysisToWorkspace() {
    const newComp: A2UIComponent = {
      id: `widget_link_analysis_${Date.now()}`,
      type: 'link-analysis',
      props: {
        title: 'Telecom Link Analysis & Relationship Graph',
        colSpan: 12
      }
    };
    this.appendComponentToWorkspace(newComp);
    this.showToast('success', 'Link Analysis Graph added to your active workspace!');
    this.activeStudioTab.set('canvas');
  }

  private appendComponentToWorkspace(comp: A2UIComponent) {
    let activePage = this.dashboardService.activePage();
    if (!activePage) {
      activePage = {
        version: '1.0.0',
        page: {
          title: this.dashboardService.activeDashboard()?.name || 'Studio Canvas',
          layout: 'grid',
          components: []
        },
        actions: []
      };
    }
    const updatedComponents = [...activePage.page.components, comp];
    this.dashboardService.activePage.set({
      ...activePage,
      page: {
        ...activePage.page,
        components: updatedComponents
      }
    });
    this.hasUnsavedChanges.set(true);
    this.dashboardService.editMode.set(true);
  }

  addToDashboard() {
    const activeDb = this.dashboardService.activeDashboard();
    const lastRes = this.lastQueryResponse();
    if (!activeDb || !lastRes) return;

    let existingComponents: A2UIComponent[] = [];
    if (activeDb.layoutConfig) {
      try {
        existingComponents = JSON.parse(activeDb.layoutConfig) as A2UIComponent[];
      } catch (e) {
        console.error('Failed to parse active dashboard layout config:', e);
      }
    }

    const newComponents = lastRes.page.components.map(comp => {
      const copy = JSON.parse(JSON.stringify(comp));
      if (!copy.props) copy.props = {};
      if (!copy.props.colSpan) {
        copy.props.colSpan = copy.type === 'map' || copy.type === 'google-map' || copy.type === 'link-analysis' ? 12 : (copy.type === 'table' ? 6 : 6);
      }
      copy.id = `${copy.id}_${Date.now()}`;
      return copy;
    });

    const updatedPage: A2UIResponse = {
      version: '1.0.0',
      page: {
        title: activeDb.name,
        layout: 'grid',
        components: [...existingComponents, ...newComponents]
      },
      actions: []
    };

    this.dashboardService.activePage.set(updatedPage);
    this.hasUnsavedChanges.set(true);
    this.dashboardService.editMode.set(true);
    this.lastQueryResponse.set(null);
    this.showToast('success', 'AI Generated components added to workspace.');
  }

  removeComponent(compId: string) {
    const activePage = this.dashboardService.activePage();
    if (!activePage) return;

    activePage.page.components = activePage.page.components.filter(c => c.id !== compId);
    this.dashboardService.activePage.set({ ...activePage });
    this.hasUnsavedChanges.set(true);
  }

  changeColSpan(compId: string, delta: number) {
    const activePage = this.dashboardService.activePage();
    if (!activePage) return;

    const comp = activePage.page.components.find(c => c.id === compId);
    if (comp) {
      if (!comp.props) comp.props = {};
      const currentSpan = comp.props.colSpan || 6;
      comp.props.colSpan = Math.max(3, Math.min(12, currentSpan + delta));
      this.dashboardService.activePage.set({ ...activePage });
      this.hasUnsavedChanges.set(true);
    }
  }

  moveComponent(index: number, direction: 'up' | 'down') {
    const activePage = this.dashboardService.activePage();
    if (!activePage) return;

    const components = [...activePage.page.components];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < components.length) {
      const temp = components[index];
      components[index] = components[targetIndex];
      components[targetIndex] = temp;
      activePage.page.components = components;
      this.dashboardService.activePage.set({ ...activePage });
      this.hasUnsavedChanges.set(true);
    }
  }

  // Drag & Drop
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  onDragLeave() {
    this.dragOverIndex.set(null);
  }

  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    this.dragOverIndex.set(null);
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

    const activePage = this.dashboardService.activePage();
    if (!activePage) return;

    const components = [...activePage.page.components];
    const dragged = components[this.draggedIndex];
    components.splice(this.draggedIndex, 1);
    components.splice(targetIndex, 0, dragged);

    activePage.page.components = components;
    this.dashboardService.activePage.set({ ...activePage });
    this.hasUnsavedChanges.set(true);
    this.dashboardService.editMode.set(true);
    this.draggedIndex = null;
  }

  getColSpanClass(comp: A2UIComponent) {
    const colSpan = comp.props?.colSpan;
    if (colSpan) {
      const classes: Record<number, string> = {
        3: 'lg:col-span-3',
        4: 'lg:col-span-4',
        5: 'lg:col-span-5',
        6: 'lg:col-span-6',
        7: 'lg:col-span-7',
        8: 'lg:col-span-8',
        9: 'lg:col-span-9',
        10: 'lg:col-span-10',
        11: 'lg:col-span-11',
        12: 'lg:col-span-12'
      };
      return classes[colSpan] || 'lg:col-span-6';
    }
    if (comp.type === 'google-map' || comp.type === 'link-analysis' || comp.type === 'network') return 'lg:col-span-12';
    if (comp.type === 'map') return 'lg:col-span-7';
    if (comp.type === 'table') return 'lg:col-span-5';
    return 'lg:col-span-6';
  }

  // Export Utilities
  exportWorkspaceAsJson() {
    const page = this.dashboardService.activePage();
    if (!page) return;
    const blob = new Blob([JSON.stringify(page, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemind-workspace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('success', 'Workspace exported as JSON.');
  }

  exportCurrentView() {
    window.print();
  }

  // Sample data generators for immediate gallery rendering
  private generateSampleTrend() {
    return [
      { date: '2026-06-15', amount: 3400 },
      { date: '2026-06-18', amount: 4800 },
      { date: '2026-06-21', amount: 4200 },
      { date: '2026-06-24', amount: 6500 },
      { date: '2026-06-27', amount: 5800 },
      { date: '2026-06-30', amount: 7200 },
      { date: '2026-07-04', amount: 8100 },
      { date: '2026-07-08', amount: 9500 }
    ];
  }

  private generateSampleRegions() {
    return [
      { region: 'Kabul Metro', amount: 78500 },
      { region: 'Herat West', amount: 46200 },
      { region: 'Mazar North', amount: 39800 },
      { region: 'Kandahar South', amount: 31200 },
      { region: 'Jalalabad East', amount: 26500 },
      { region: 'Kunduz Hub', amount: 18400 }
    ];
  }

  private generateSampleUsage() {
    return [
      { region: 'Kabul', tower: 'KBL-01', data_mb: 18400, voice_minutes: 2100, amount: 8400 },
      { region: 'Kabul', tower: 'KBL-02', data_mb: 14200, voice_minutes: 1800, amount: 6200 },
      { region: 'Herat', tower: 'HRT-01', data_mb: 11200, voice_minutes: 1300, amount: 4900 },
      { region: 'Mazar', tower: 'MZR-01', data_mb: 14300, voice_minutes: 1650, amount: 5900 },
      { region: 'Kandahar', tower: 'KDH-01', data_mb: 8900, voice_minutes: 980, amount: 3800 }
    ];
  }

  private generateSamplePlans() {
    return [
      { plan: 'Postpaid Unlimited', count: 42000 },
      { plan: 'Prepaid Monthly', count: 78000 },
      { plan: 'Postpaid Corporate', count: 24000 },
      { plan: 'Prepaid Daily', count: 18000 },
      { plan: '5G Data Bundle', count: 35000 }
    ];
  }

  private generateSampleScatter() {
    return [
      { msisdn: 'KBL-VIP-01', recharge_amount: 1500, amount: 18200 },
      { msisdn: 'HRT-USR-02', recharge_amount: 500, amount: 6400 },
      { msisdn: 'MZR-CORP-03', recharge_amount: 2500, amount: 28500 },
      { msisdn: 'KDH-USR-04', recharge_amount: 350, amount: 4100 },
      { msisdn: 'JLD-VIP-05', recharge_amount: 3000, amount: 34000 }
    ];
  }
}
