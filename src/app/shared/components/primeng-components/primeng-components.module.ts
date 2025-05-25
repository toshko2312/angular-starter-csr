import { NgModule } from "@angular/core";
import { ButtonModule } from "primeng/button";

const PrimeNgModules = [
  ButtonModule
]

@NgModule({
  declarations: [],
  imports: [...PrimeNgModules],
  exports: [...PrimeNgModules]
})
export class PrimeNgComponentsModule {}