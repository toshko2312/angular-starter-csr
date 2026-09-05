import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { CONSTANTS } from '@shared/constants';
import { filter, map, take } from 'rxjs';

/**
 * Keeps the admin sub-pages behind the login form. The session hydrates
 * asynchronously, so the decision waits for isReady() — otherwise a hard
 * refresh on /admin/menu bounces to the login page before the stored session
 * has been read back.
 *
 * This is UI only. Write access is enforced by row level security on the
 * `authenticated` role; see supabase/migrations.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const language = inject(LanguageService);
  // Read off the target URL, not the router's: this runs before navigation
  // completes, so language.current() still reflects the page being left.
  const login = language.localize(`/${CONSTANTS.ADMIN_PAGE}`, language.languageOf(state.url));

  return toObservable(auth.isReady).pipe(
    filter(Boolean),
    take(1),
    map(() => auth.isAuthenticated() || router.parseUrl(login))
  );
};
