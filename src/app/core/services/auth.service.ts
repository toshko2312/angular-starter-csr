import { computed, Injectable, signal } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { environment } from '@environments/environment';
import { CONSTANTS } from '@shared/constants';
import { Session } from '@supabase/supabase-js';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentSession = signal<Session | null>(null);
  /** Null until the first getSession() resolves, so the page can avoid flashing the login form. */
  private readonly ready = signal(false);

  readonly session = this.currentSession.asReadonly();
  readonly isReady = this.ready.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentSession());

  constructor() {
    // persistSession is on in supabase.client.ts, so a login survives reload.
    void supabase.auth.getSession().then(({ data }) => {
      this.currentSession.set(data.session);
      this.ready.set(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.ready.set(true);
    });
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
    return from(
      supabase.auth.signInWithPassword({
        email: this.toEmail(username),
        password,
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  signOut(): Observable<void> {
    return from(supabase.auth.signOut()).pipe(map(() => undefined));
  }
}
