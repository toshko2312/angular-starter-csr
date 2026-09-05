import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { environment } from '@environments/environment';
import { CONSTANTS } from '@shared/constants';
import { Session } from '@supabase/supabase-js';
import { from, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentSession = signal<Session | null>(null);
  /** Null until the first getSession() resolves, so the page can avoid flashing the login form. */
  private readonly ready = signal(false);
  /** Set when the 30-day cap ended the session, so the login page can say why. */
  private readonly expiredFlag = signal(false);

  readonly session = this.currentSession.asReadonly();
  readonly isReady = this.ready.asReadonly();
  readonly expired = this.expiredFlag.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentSession());

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    // Sessions live in localStorage; prerendering has neither a browser nor a
    // signed-in admin, and the public pages never need one.
    if (!this.isBrowser) {
      this.ready.set(true);
      return;
    }

    // persistSession is on in supabase.client.ts, so a login survives reload.
    void supabase.auth.getSession().then(({ data }) => {
      this.adopt(data.session);
      this.ready.set(true);
    });

    // Fires on sign-in, sign-out and every token refresh, so the age check
    // below also catches a tab that was left open past the cap.
    supabase.auth.onAuthStateChange((_event, session) => {
      this.adopt(session);
      this.ready.set(true);
    });
  }

  /**
   * Supabase refresh tokens do not expire on their own, so the 30-day limit is
   * enforced here: the age of the login is stamped in localStorage and checked
   * every time the session surfaces.
   */
  private adopt(session: Session | null): void {
    if (!session) {
      this.currentSession.set(null);
      return;
    }

    const startedAt = this.readStamp();

    // A session that predates this check has no stamp — start its clock now
    // rather than signing the admin out on the deploy that introduced it.
    if (startedAt === null) {
      this.stampSession();
      this.currentSession.set(session);
      return;
    }

    if (Date.now() - startedAt > CONSTANTS.SESSION_MAX_AGE_MS) {
      this.expiredFlag.set(true);
      this.currentSession.set(null);
      this.signOut().subscribe();
      return;
    }

    this.currentSession.set(session);
  }

  private readStamp(): number | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(CONSTANTS.SESSION_STARTED_AT_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private stampSession(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(CONSTANTS.SESSION_STARTED_AT_KEY, String(Date.now()));
  }

  private clearStamp(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(CONSTANTS.SESSION_STARTED_AT_KEY);
  }

  /**
   * The form asks for a username ("admin"); Supabase authenticates on an email.
   * A bare username is mapped to the configured admin address. An address is
   * not a secret — the password lives in Supabase and never reaches the bundle.
   */
  private toEmail(username: string): string {
    const name = username.trim();
    if (name.includes('@')) return name;
    return environment.ADMIN_EMAIL || CONSTANTS.ADMIN_EMAIL_FALLBACK;
  }

  signIn(username: string, password: string): Observable<void> {
    // A fresh login restarts the 30-day clock; stamp before the auth state
    // change lands, or adopt() would treat the old stamp as still current.
    this.clearStamp();

    return from(
      supabase.auth.signInWithPassword({
        email: this.toEmail(username),
        password,
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        this.stampSession();
        this.expiredFlag.set(false);
      })
    );
  }

  signOut(): Observable<void> {
    return from(supabase.auth.signOut()).pipe(
      map(() => {
        this.clearStamp();
      })
    );
  }
}
