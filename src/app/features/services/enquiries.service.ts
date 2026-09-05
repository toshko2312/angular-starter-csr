import { computed, Injectable, signal } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { EnquiryModel, EnquiryRecord } from '@shared/models/enquiry.model';
import { from, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EnquiriesService {
  /**
   * The rows the admin panel last read. Held here rather than in the requests
   * page so the navbar can badge the unhandled count without a second read,
   * and so marking one handled updates the badge immediately.
   */
  private readonly rowsState = signal<EnquiryRecord[]>([]);
  readonly rows = this.rowsState.asReadonly();
  readonly openCount = computed(() => this.rowsState().filter((row) => !row.handled).length);

  submit(enquiry: EnquiryModel): Observable<boolean> {
    // Minted here rather than read back: insert().select() compiles to a
    // RETURNING, which RLS judges as a SELECT, and anon deliberately has no
    // select policy on this table. The column default covers every other
    // insert path, so nothing else has to change.
    const id = crypto.randomUUID();

    return from(supabase.from('enquiries').insert({ ...enquiry, id })).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return true;
      }),
      tap(() => this.notify(id))
    );
  }

  /**
   * Fire-and-forget: the row is already saved by the time this runs, so a
   * failed notification is the admin's problem and must never turn a
   * successful submission into an error on the visitor's screen.
   */
  private notify(id: string): void {
    supabase.functions
      .invoke('notify-enquiry', { body: { id } })
      .catch((err) => console.error('Enquiry notification failed:', err));
  }

  /**
   * Admin-only, and deliberately uncached and un-swallowed: reads are denied
   * for anon by RLS, and a denied read must surface as an error rather than
   * look like an empty inbox.
   */
  fetch(): Observable<EnquiryRecord[]> {
    return from(
      supabase.from('enquiries').select().order('created_at', { ascending: false })
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return (result.data || []) as EnquiryRecord[];
      })
    );
  }

  /** fetch() plus caching, for every caller that also wants the badge fed. */
  load(): Observable<EnquiryRecord[]> {
    return this.fetch().pipe(tap((rows) => this.rowsState.set(rows)));
  }

  /** Signing out must not leave the previous admin's count on screen. */
  clear(): void {
    this.rowsState.set([]);
  }

  setHandled(id: string, handled: boolean): Observable<void> {
    return from(
      supabase
        .from('enquiries')
        .update({ handled, handled_at: handled ? new Date().toISOString() : null })
        .eq('id', id)
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.rowsState.update((rows) =>
          rows.map((row) =>
            row.id === id
              ? { ...row, handled, handled_at: handled ? new Date().toISOString() : null }
              : row
          )
        );
      })
    );
  }

  remove(id: string): Observable<void> {
    return from(supabase.from('enquiries').delete().eq('id', id)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.rowsState.update((rows) => rows.filter((row) => row.id !== id));
      })
    );
  }
}
