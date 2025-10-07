import { Routes } from '@angular/router';
import { HomeComponent } from './core/components/home/home.component';
import { TranslationLoaderGuard } from './core/guards/translate.guard';
import { ContactsPageComponent } from './features/pages/contacts-page/contacts-page.component';
import { MenuPageComponent } from './features/pages/menu-page/menu-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [TranslationLoaderGuard],
  },
  {
    path: 'contacts',
    component: ContactsPageComponent,
    canActivate: [TranslationLoaderGuard],
  },
    {
    path: 'menu',
    component: MenuPageComponent,
    canActivate: [TranslationLoaderGuard],
  },
];
