import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

/**
 * Freezes the page behind an overlay. Depth-counted so a dialog opened on top
 * of another (a confirm inside an editor, the image viewer over a page) does
 * not release the lock when only the inner one closes.
 */
@Injectable({
  providedIn: 'root',
})
export class ScrollLockService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private depth = 0;
  private previousOverflow = '';

  lock(): void {
    if (!this.isBrowser) return;
    if (this.depth === 0) {
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    this.depth++;
  }

  release(): void {
    if (!this.isBrowser || this.depth === 0) return;
    this.depth--;
    if (this.depth === 0) document.body.style.overflow = this.previousOverflow;
  }
}
