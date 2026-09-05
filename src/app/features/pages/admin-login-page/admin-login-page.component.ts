import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  private language = inject(LanguageService);

  readonly CONSTANTS = CONSTANTS;
  readonly auth = inject(AuthService);

  readonly loginError = signal('');
  readonly signingIn = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    username: ['admin', Validators.required],
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
        this.loginForm.reset({ username: 'admin', password: '' });
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
    void this.router.navigateByUrl(this.language.localize(CONSTANTS.ADMIN_MENU_PAGE));
  }
}
