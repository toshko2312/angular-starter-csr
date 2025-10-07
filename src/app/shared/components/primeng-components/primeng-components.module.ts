import { NgModule } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MenubarModule } from 'primeng/menubar';
import { TabViewModule } from 'primeng/tabview';
import { CarouselModule } from 'primeng/carousel';
import { Tag } from 'primeng/tag';



const PrimeNgModules = [
  ButtonModule,
  MenubarModule,
  TabViewModule,
  CarouselModule,
  Tag
]

@NgModule({
  declarations: [],
  imports: [...PrimeNgModules],
  exports: [...PrimeNgModules]
})
export class PrimeNgComponentsModule {}