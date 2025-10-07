import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { CONSTANTS } from '../../../shared/constants';
import { SharedModule } from '@shared/shared.module';
import { ProductsListComponent } from '../../../features/components/products-list/products-list.component';

@Component({
  selector: 'app-home',
  imports: [SharedModule, ProductsListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  CONSTANTS = CONSTANTS;

  constructor() {}

  ngOnInit(): void {
  }
}
