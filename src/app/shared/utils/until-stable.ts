import { isPlatformBrowser } from '@angular/common';
import { inject, PendingTasks, PLATFORM_ID } from '@angular/core';
import { defer, finalize, MonoTypeOperatorFunction, Observable } from 'rxjs';

/**
 * Holds the application "unstable" until the source completes, so the
 * prerenderer waits for the data instead of serializing an empty page.
 *
 * The data layer talks to Supabase through the supabase-js SDK, which uses
 * global fetch. Angular only waits on work it knows about, and the plain
 * `zone.js` polyfill zoneifies fetch's promise without registering it as a
 * macrotask, so `ApplicationRef.whenStable()` can fire while the request is
 * still parked on Node I/O. That is why the first prerendered route shipped
 * without its rows while later ones — served over an already-warm connection
 * — happened to win the race.
 *
 * PendingTasks is the supported way to declare that work explicitly. Browser
 * stability is deliberately left alone: there the rows arrive after hydration
 * either way, and delaying isStable would hold up hydration event replay.
 *
 * Must be called from an injection context — assign it to a field.
 */
export function untilStable<T>(): MonoTypeOperatorFunction<T> {
  if (isPlatformBrowser(inject(PLATFORM_ID))) return (source: Observable<T>) => source;

  const pendingTasks = inject(PendingTasks);

  return (source: Observable<T>) =>
    defer(() => {
      const done = pendingTasks.add();
      return source.pipe(finalize(done));
    });
}
