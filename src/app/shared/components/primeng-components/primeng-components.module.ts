import { NgModule } from "@angular/core";

/**
 * The UI is custom markup matching the design system, so no PrimeNG components
 * are imported here.
 *
 * Note this stays empty even though p-datepicker is now used: SharedModule
 * re-exports this module and every component imports SharedModule, so anything
 * listed here lands in the common chunk. DatePicker is imported directly by
 * the two components that need it instead.
 */
const PrimeNgModules: never[] = []

@NgModule({
  declarations: [],
  imports: [...PrimeNgModules],
  exports: [...PrimeNgModules]
})
export class PrimeNgComponentsModule {}
