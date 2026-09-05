import { Route, Routes } from '@angular/router';
import { HomeComponent } from './core/components/home/home.component';
import { adminGuard } from './core/guards/admin.guard';
import { TranslationLoaderGuard } from './core/guards/translate.guard';
import { CONSTANTS } from './shared/constants';
import { MenuPageComponent } from './features/pages/menu-page/menu-page.component';

/**
 * The public pages, mounted twice: at the root for Bulgarian and under /en for
 * English. Each language needs its own URL to be indexable, and both branches
 * are prerendered (see prerender-routes.txt).
 */
const publicRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [TranslationLoaderGuard],
  },
  {
    // Lazy: this is the only public page carrying the PrimeNG date picker, and
    // the initial bundle is already over budget. Prerendering is unaffected.
    path: 'contacts',
    canActivate: [TranslationLoaderGuard],
    loadComponent: () =>
      import('./features/pages/contacts-page/contacts-page.component').then(
        (m) => m.ContactsPageComponent
      ),
  },
  {
    path: 'menu',
    component: MenuPageComponent,
    canActivate: [TranslationLoaderGuard],
  },
];

/**
 * The admin branch, built fresh per mount: the same object cannot be reused in
 * two route arrays because the router stores loaded-children state on it.
 *
 * Hidden: the navbar links the children only once signed in, robots.txt
 * disallows it, and the shell sets robots noindex itself. Lazy so the admin
 * bundle never reaches ordinary visitors, and left out of prerender-routes.txt
 * so it is never rendered to static HTML.
 *
 * The empty child is the login page rather than a redirect to 'menu': a
 * redirect plus a guard that sends an anonymous visitor back to /admin would
 * loop.
 */
function adminRoute(): Route {
  return {
    path: CONSTANTS.ADMIN_PAGE,
    canActivate: [TranslationLoaderGuard],
    loadComponent: () =>
      import('./features/pages/admin-page/admin-page.component').then(
        (m) => m.AdminPageComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/pages/admin-login-page/admin-login-page.component').then(
            (m) => m.AdminLoginPageComponent
          ),
      },
      {
        path: 'menu',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/pages/admin-menu-page/admin-menu-page.component').then(
            (m) => m.AdminMenuPageComponent
          ),
      },
      {
        path: 'categories',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/pages/admin-categories-page/admin-categories-page.component').then(
            (m) => m.AdminCategoriesPageComponent
          ),
      },
      {
        path: 'landing',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/pages/admin-projects-page/admin-projects-page.component').then(
            (m) => m.AdminProjectsPageComponent
          ),
      },
      {
        path: 'requests',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/pages/admin-enquiries-page/admin-enquiries-page.component').then(
            (m) => m.AdminEnquiriesPageComponent
          ),
      },
    ],
  };
}

export const routes: Routes = [
  {
    path: CONSTANTS.LANGUAGE_EN_PREFIX,
    // Admin before the public pages: the empty path would swallow /en/admin.
    children: [adminRoute(), ...publicRoutes],
  },
  adminRoute(),
  // Bulgarian last: its empty path would otherwise swallow /en and /admin.
  ...publicRoutes,
];
