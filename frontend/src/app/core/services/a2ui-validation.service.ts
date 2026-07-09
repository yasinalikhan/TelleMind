import { Injectable } from '@angular/core';
import { A2UIResponse, A2UIComponent } from '../models/a2ui.model';

@Injectable({
  providedIn: 'root'
})
export class A2UIValidationService {
  private allowedTypes = ['kpi', 'chart', 'table', 'form', 'filter', 'map', 'card'];
  private allowedActions = ['OPEN_PAGE', 'DRILL_DOWN', 'FILTER_DATA', 'CALL_API', 'EXPORT_DATA', 'REFRESH'];

  validateResponse(response: any): A2UIResponse {
    if (!response) {
      throw new Error('A2UI Response is null or undefined.');
    }
    if (response.version !== '1.0.0') {
      throw new Error(`Unsupported A2UI Version: ${response.version}`);
    }
    if (!response.page || typeof response.page !== 'object') {
      throw new Error('A2UI Response missing valid page property.');
    }
    if (!response.page.title) {
      throw new Error('A2UI Response page missing title.');
    }
    if (!Array.isArray(response.page.components)) {
      throw new Error('A2UI Response page.components must be an array.');
    }

    // Validate components
    response.page.components.forEach((comp: any, idx: number) => {
      this.validateComponent(comp, idx);
    });

    // Deep sanitize properties to prevent XSS injection
    this.sanitizeObject(response);

    return response as A2UIResponse;
  }

  private validateComponent(comp: any, idx: number): void {
    if (!comp.id) {
      throw new Error(`Component at index ${idx} is missing an 'id'.`);
    }
    if (!comp.type || !this.allowedTypes.includes(comp.type)) {
      throw new Error(`Component ${comp.id} has invalid or missing type: ${comp.type}`);
    }
    if (!comp.props || typeof comp.props !== 'object') {
      throw new Error(`Component ${comp.id} is missing a 'props' object.`);
    }

    // Validate events
    if (comp.events) {
      if (!Array.isArray(comp.events)) {
        throw new Error(`Component ${comp.id} 'events' must be an array.`);
      }
      comp.events.forEach((ev: any, evIdx: number) => {
        if (!ev.event) {
          throw new Error(`Component ${comp.id} event at index ${evIdx} is missing 'event' name.`);
        }
        if (!ev.action || typeof ev.action !== 'object') {
          throw new Error(`Component ${comp.id} event ${ev.event} is missing 'action' object.`);
        }
        if (!ev.action.type || !this.allowedActions.includes(ev.action.type)) {
          throw new Error(`Component ${comp.id} event ${ev.event} has invalid action type: ${ev.action.type}`);
        }
      });
    }
  }

  private sanitizeObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (typeof val === 'string') {
          obj[key] = this.sanitizeString(val);
        } else if (typeof val === 'object') {
          this.sanitizeObject(val);
        }
      }
    }
  }

  private sanitizeString(str: string): string {
    // Block script tags, javascript: urls, and inline event handlers
    let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript\s*:/gi, 'unsafe-javascript:');
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, 'unsafe-attribute=');
    return sanitized;
  }
}
