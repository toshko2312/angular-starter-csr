import { NgModule } from '@angular/core';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { PrimeNgComponentsModule } from './components/primeng-components/primeng-components.module';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective, CommonModule, RouterLink],
  exports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective, CommonModule, RouterLink],
})
export class SharedModule {}