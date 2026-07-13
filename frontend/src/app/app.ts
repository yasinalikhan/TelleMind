import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardConfig } from './core/services/dashboard.service';
import { AiService } from './core/services/ai.service';
import { A2UIRegistryService } from './core/services/a2ui-registry.service';
import { A2UIValidationService } from './core/services/a2ui-validation.service';
import { A2UIActionService } from './core/services/a2ui-action.service';
import { A2UIResponse, A2UIComponent } from './core/models/a2ui.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly dashboardService = inject(DashboardService);
  private readonly aiService = inject(AiService);
  private readonly registry = inject(A2UIRegistryService);
  private readonly validator = inject(A2UIValidationService);
  private readonly actionService = inject(A2UIActionService);

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

  queryText = signal('');
  username = signal('admin');
  password = signal('admin123');
  selectedTenant = signal(localStorage.getItem('tenantId') || 'tenant_1');
  showSql = signal(false);
  newDashboardName = signal('');

  // Keeps track of widgets generated from the last AI natural language query
  lastQueryResponse = signal<A2UIResponse | null>(null);

  // Drag and Drop tracking variables
  draggedIndex: number | null = null;
  dragOverIndex = signal<number | null>(null);

  suggestions = [
    'Show revenue trend for last 30 days',
    'Show top 10 subscribers by recharge amount',
    'Compare data usage by region',
    'Show inactive subscribers',
    'Display network usage on map'
  ];

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
      this.runQuery(this.suggestions[0]);
    }
  }

  getComponentType(type: string) {
    return this.registry.getComponentType(type);
  }

  onLogin() {
    this.dashboardService.login(this.username(), this.password(), this.selectedTenant());
    setTimeout(() => {
      if (this.dashboardService.token()) {
        this.dashboardService.loadDashboards();
        this.runQuery(this.suggestions[0]);
      }
    }, 1000);
  }

  onLogout() {
    this.dashboardService.logout();
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
    this.runQuery(this.queryText() || this.suggestions[0]);
  }

  // Workspace Actions
  selectDashboard(db: DashboardConfig | null) {
    this.dashboardService.activeDashboard.set(db);
    this.dashboardService.editMode.set(false);
    this.lastQueryResponse.set(null);

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

    this.dashboardService.createDashboard(name).subscribe({
      next: (newDb) => {
        this.newDashboardName.set('');
        this.dashboardService.loadDashboards();
        // Automatically select the new dashboard
        setTimeout(() => this.selectDashboard(newDb), 300);
      },
      error: (err) => {
        console.error('Failed to create dashboard:', err);
      }
    });
  }

  saveWorkspace() {
    const db = this.dashboardService.activeDashboard();
    const page = this.dashboardService.activePage();
    if (!db || !page || !db.id) return;

    const layoutStr = JSON.stringify(page.page.components);
    this.dashboardService.updateDashboard(db.id, db.name, layoutStr).subscribe({
      next: (updatedDb) => {
        this.dashboardService.editMode.set(false);
        this.dashboardService.loadDashboards();
        // Update the active reference
        this.dashboardService.activeDashboard.set(updatedDb);
      },
      error: (err) => {
        console.error('Failed to save dashboard:', err);
      }
    });
  }

  deleteWorkspace() {
    const db = this.dashboardService.activeDashboard();
    if (!db || !db.id) return;

    if (!confirm(`Are you sure you want to delete dashboard "${db.name}"?`)) {
      return;
    }

    this.dashboardService.deleteDashboard(db.id).subscribe({
      next: () => {
        this.selectDashboard(null);
        this.dashboardService.loadDashboards();
      },
      error: (err) => {
        console.error('Failed to delete dashboard:', err);
      }
    });
  }

  toggleEditMode() {
    this.dashboardService.editMode.update(v => !v);
  }

  // Widget Layout Modification Actions
  addToDashboard() {
    const activeDb = this.dashboardService.activeDashboard();
    const activePage = this.dashboardService.activePage();
    const lastRes = this.lastQueryResponse();

    if (!activeDb || !activePage || !lastRes) return;

    const currentComponents = [...activePage.page.components];
    const newComponents = lastRes.page.components.map(comp => {
      // Deep copy component and add default colSpan if not present
      const copy = JSON.parse(JSON.stringify(comp));
      if (!copy.props) copy.props = {};
      // default map to 7 columns, tables to 5, others to 6
      if (!copy.props.colSpan) {
        copy.props.colSpan = copy.type === 'map' ? 7 : (copy.type === 'table' ? 5 : 6);
      }
      // suffix widget id to prevent duplicates
      copy.id = `${copy.id}_${Date.now()}`;
      return copy;
    });

    activePage.page.components = [...currentComponents, ...newComponents];
    this.dashboardService.activePage.set({ ...activePage });
    // Automatically turn on edit mode so they see controls and remember to save
    this.dashboardService.editMode.set(true);
    // Clear last response so button disappears
    this.lastQueryResponse.set(null);
  }

  removeComponent(compId: string) {
    const activePage = this.dashboardService.activePage();
    if (!activePage) return;

    activePage.page.components = activePage.page.components.filter(c => c.id !== compId);
    this.dashboardService.activePage.set({ ...activePage });
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
    }
  }

  moveComponent(index: number, direction: 'up' | 'down') {
    const activePage = this.dashboardService.activePage();
    if (!activePage) return;

    const components = [...activePage.page.components];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < components.length) {
      // Swap components
      const temp = components[index];
      components[index] = components[targetIndex];
      components[targetIndex] = temp;

      activePage.page.components = components;
      this.dashboardService.activePage.set({ ...activePage });
    }
  }

  // Drag and Drop Event Handlers
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault(); // Necessary to allow dropping
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
    const draggedComponent = components[this.draggedIndex];

    // Remove from old position and insert at new position
    components.splice(this.draggedIndex, 1);
    components.splice(targetIndex, 0, draggedComponent);

    activePage.page.components = components;
    this.dashboardService.activePage.set({ ...activePage });
    
    // Automatically turn on edit mode so they see controls and remember to save
    this.dashboardService.editMode.set(true);

    this.draggedIndex = null;
  }

  getColSpanClass(comp: A2UIComponent) {
    // Read colSpan from props, fallback to type defaults
    const colSpan = comp.props?.colSpan;
    if (colSpan) {
      // Map to static class name literals so Tailwind compiler includes them
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
    // Default system columns
    if (comp.type === 'map') return 'lg:col-span-7';
    if (comp.type === 'table') return 'lg:col-span-5';
    return 'lg:col-span-12';
  }
}
