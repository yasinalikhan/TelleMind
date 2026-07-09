import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'a2ui-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
      <!-- Table Header -->
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">{{ props().title }}</h3>
          <p class="text-xs text-slate-400">Showing {{ filteredData().length }} of {{ props().data?.length || 0 }} records</p>
        </div>
        
        <!-- Table Search -->
        <div class="relative">
          <input type="text" 
                 placeholder="Search records..." 
                 (input)="setSearchQuery($any($event.target).value)"
                 class="w-full sm:w-64 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>

      <!-- Scrollable Table -->
      <div class="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/20">
        <table class="w-full border-collapse text-left text-sm text-slate-300">
          <thead>
            <tr class="border-b border-white/10 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              @for (col of columns(); track col) {
                <th class="px-6 py-4 cursor-pointer hover:text-white transition-colors duration-200" (click)="toggleSort(col)">
                  <div class="flex items-center gap-1.5">
                    <span>{{ formatHeader(col) }}</span>
                    @if (sortCol() === col) {
                      <span class="text-indigo-400 text-xs">{{ sortAsc() ? '▲' : '▼' }}</span>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            @for (row of sortedData(); track $index) {
              <tr class="transition-colors duration-150 hover:bg-white/[0.02]">
                @for (col of columns(); track col) {
                  <td class="whitespace-nowrap px-6 py-3.5 text-slate-300">
                    @let val = row[col];
                    @if (col === 'status') {
                      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                            [ngClass]="val === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'">
                        {{ val }}
                      </span>
                    } @else if (col === 'recharge_amount' || col === 'amount') {
                      <span class="font-bold text-white">\${{ formatNumber(val) }}</span>
                    } @else {
                      <span>{{ val }}</span>
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns().length" class="px-6 py-10 text-center text-slate-500 text-sm">
                  No records matching the search query.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TableComponent {
  props = input.required<any>();
  events = input<any[]>([]);

  searchQuery = signal('');
  sortCol = signal<string | null>(null);
  sortAsc = signal(true);

  columns = computed(() => {
    const rawData = this.props().data || [];
    const rawCols = this.props().columns;
    if (rawCols && rawCols.length > 0) return rawCols;
    if (rawData.length > 0) {
      return Object.keys(rawData[0]).filter(c => c !== 'tenant_id');
    }
    return [];
  });

  filteredData = computed(() => {
    const data = this.props().data || [];
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return data;

    return data.filter((row: any) => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      )
    );
  });

  sortedData = computed(() => {
    const data = [...this.filteredData()];
    const col = this.sortCol();
    if (!col) return data;

    const asc = this.sortAsc();
    return data.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return asc ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return asc ? -1 : 1;
      if (strA > strB) return asc ? 1 : -1;
      return 0;
    });
  });

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  toggleSort(col: string): void {
    if (this.sortCol() === col) {
      this.sortAsc.update(val => !val);
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  formatHeader(col: string): string {
    return col.replace('_', ' ').toUpperCase();
  }

  formatNumber(val: any): string {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return String(val);
  }
}
