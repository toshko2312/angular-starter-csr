import { NgModule } from '@angular/core';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { PrimeNgComponentsModule } from './components/primeng-components/primeng-components.module';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [],
  imports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective, CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  exports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective, CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
})
export class SharedModule {}
