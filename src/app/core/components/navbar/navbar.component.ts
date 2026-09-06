import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { ThemeService } from '@core/services/theme.service';
import { CONSTANTS } from '@shared/constants';
import { localePath } from '@shared/utils/locale-path';
import { SocialLinksComponent } from '@shared/components/social-links/social-links.component';
import { SharedModule } from '@shared/shared.module';
import { filter, map } from 'rxjs';
import { CartService } from '../../../features/services/cart.service';
import { EnquiriesService } from '../../../features/services/enquiries.service';

@Component({
  selector: 'app-navbar',
  imports: [SharedModule, SocialLinksComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly CONSTANTS = CONSTANTS;
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  private readonly enquiries = inject(EnquiriesService);

  /** Unhandled requests, badged on the admin menu. Zero renders nothing. */
  readonly openRequests = this.enquiries.openCount;

  /** The admin trigger is a button, so it cannot use routerLinkActive. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isAdminRoute = computed(() =>
    this.url().startsWith(this.language.localize(`/${CONSTANTS.ADMIN_PAGE}`))
  );
  readonly adminMenuOpen = signal(false);

  constructor() {
    // The badge needs the rows before the requests page is ever opened, and
    // the read is denied to anon by RLS — so it waits for a session. Runs
    // again after a fresh sign-in; never on the server, where no session
    // hydrates.
    effect(() => {
      if (!this.auth.isAuthenticated()) {
        this.enquiries.clear();
        return;
      }
      this.enquiries.load().subscribe({
        error: (err) => console.error('Error fetching enquiries:', err),
      });
    });

    // Navigating from a dropdown item dismisses it, so the items do not each
    // need their own click handler.
    effect(() => {
      this.url();
      this.adminMenuOpen.set(false);
    });
  }

  toggleAdminMenu(): void {
    this.adminMenuOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.adminMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.adminMenuOpen.set(false);
  }

  /** Keeps the public links inside the active language branch. */
  localePath(page: string): string {
    return localePath(page, this.language.current());
  }

  /** The admin pages are mounted in both language branches, like the public ones. */
  adminPath(page: string): string {
    return this.language.localize(page);
  }

  /** Language lives in the URL now, so switching is a navigation. */
  switchLanguage(lang: string): void {
    if (this.language.current() === lang) return;
    void this.router.navigateByUrl(this.language.otherLanguageUrl());
  }

  signOut(): void {
    this.auth.signOut().subscribe(() => {
      // Signing out from an admin page would leave a dead screen: adminGuard
      // has already run for that route and will not re-evaluate.
      if (this.isAdminRoute()) void this.router.navigateByUrl(this.localePath(CONSTANTS.HOME_PAGE));
    });
  }
}
