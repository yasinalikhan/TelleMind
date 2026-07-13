export interface A2UIResponse {
  version: string;
  page: A2UIPage;
  actions: A2UIAction[];
  metadata?: any;
}

export interface A2UIPage {
  title: string;
  layout: 'grid' | 'vertical' | 'horizontal';
  components: A2UIComponent[];
}

export interface A2UIComponent {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'form' | 'filter' | 'map' | 'card';
  props: any;
  events?: A2UIEvent[];
}

export interface A2UIEvent {
  event: string;
  action: A2UIAction;
}

export interface A2UIAction {
  type: 'OPEN_PAGE' | 'DRILL_DOWN' | 'FILTER_DATA' | 'CALL_API' | 'EXPORT_DATA' | 'REFRESH';
  target: string;
  parameter: string;
}
