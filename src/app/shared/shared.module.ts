import { NgModule } from '@angular/core';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { PrimeNgComponentsModule } from './components/primeng-components/primeng-components.module';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { PaginationComponent } from './components/pagination/pagination.component';
import { SelectComponent } from './components/select/select.component';

@NgModule({
  declarations: [],
  imports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective, CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule, SelectComponent, PaginationComponent],
  exports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective, CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule, SelectComponent, PaginationComponent],
})
export class SharedModule {}
