import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-admin-login-page',
  imports: [SharedModule],
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPageComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private language = inject(LanguageService);

  readonly CONSTANTS = CONSTANTS;
  readonly auth = inject(AuthService);

  readonly loginError = signal('');
  readonly signingIn = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    username: [CONSTANTS.ADMIN_LOGIN_USERNAME, Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    // The stored session hydrates asynchronously, so this has to react rather
    // than check once: arriving at /admin already signed in goes straight to
    // the first management screen.
    effect(() => {
      if (this.auth.isReady() && this.auth.isAuthenticated()) this.goToPanel();
    });
  }

  signIn(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();
    this.signingIn.set(true);
    this.loginError.set('');

    this.auth.signIn(username, password).subscribe({
      next: () => {
        this.signingIn.set(false);
        this.loginForm.reset({ username: CONSTANTS.ADMIN_LOGIN_USERNAME, password: '' });
        this.goToPanel();
      },
      error: (err) => {
        console.error('Sign-in failed:', err);
        this.signingIn.set(false);
        this.loginError.set(err?.message || 'sign-in failed');
      },
    });
  }

  private goToPanel(): void {
    const requested = this.safeReturnUrl(
      this.route.snapshot.queryParamMap.get(CONSTANTS.RETURN_URL_PARAM)
    );
    void this.router.navigateByUrl(
      requested ?? this.language.localize(CONSTANTS.ADMIN_MENU_PAGE)
    );
  }

  /**
   * Only same-origin admin paths. An unvalidated returnUrl would let a crafted
   * link bounce a freshly signed-in admin to an arbitrary host, so anything
   * absolute ('https://…') or protocol-relative ('//host') is refused, as is
   * any path outside the admin section.
   */
  private safeReturnUrl(raw: string | null): string | null {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
    const path = raw.split(/[?#]/)[0];
    return /^\/(en\/)?admin(\/|$)/.test(path) ? raw : null;
  }
}
