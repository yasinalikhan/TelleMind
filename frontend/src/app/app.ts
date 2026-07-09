import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from './core/services/dashboard.service';
import { AiService } from './core/services/ai.service';
import { A2UIRegistryService } from './core/services/a2ui-registry.service';
import { A2UIValidationService } from './core/services/a2ui-validation.service';
import { A2UIActionService } from './core/services/a2ui-action.service';

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

  queryText = signal('');
  username = signal('admin');
  password = signal('admin123');
  selectedTenant = signal(localStorage.getItem('tenantId') || 'tenant_1');

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

  runQuery(text: string) {
    this.queryText.set(text);
    this.dashboardService.loading.set(true);
    this.dashboardService.error.set(null);

    this.aiService.postQuery(text).subscribe({
      next: (response) => {
        try {
          const validated = this.validator.validateResponse(response);
          this.dashboardService.activePage.set(validated);
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
    this.runQuery(this.queryText() || this.suggestions[0]);
  }
}

