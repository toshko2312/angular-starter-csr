import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/**
 * Adds and removes page-level JSON-LD blocks, the same way
 * admin-page.component.ts manages its robots meta tag. The site-wide
 * Organization/Caterer graph is static in index.html; this is for the
 * per-page schema built from live data.
 */
@Injectable({
  providedIn: 'root',
})
export class JsonLdService {
  private readonly document = inject(DOCUMENT);

  set(id: string, schema: unknown): void {
    const script = this.find(id) ?? this.create(id);
    script.textContent = JSON.stringify(schema);
  }

  remove(id: string): void {
    this.find(id)?.remove();
  }

  private find(id: string): HTMLScriptElement | null {
    return this.document.head.querySelector<HTMLScriptElement>(`script[data-schema="${id}"]`);
  }

  private create(id: string): HTMLScriptElement {
    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-schema', id);
    this.document.head.appendChild(script);
    return script;
  }
}
