import { NgModule } from '@angular/core';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { PrimeNgComponentsModule } from './components/primeng-components/primeng-components.module';

@NgModule({
  declarations: [],
  imports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective],
  exports: [PrimeNgComponentsModule, TranslatePipe, TranslateDirective],
})
export class SharedModule {}