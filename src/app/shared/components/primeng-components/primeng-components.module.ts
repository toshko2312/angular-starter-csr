import { NgModule } from "@angular/core";

/**
 * The UI is now custom markup matching the design system, so no PrimeNG
 * components are imported. Kept as the seam for reintroducing any.
 */
const PrimeNgModules: never[] = []

@NgModule({
  declarations: [],
  imports: [...PrimeNgModules],
  exports: [...PrimeNgModules]
})
export class PrimeNgComponentsModule {}
