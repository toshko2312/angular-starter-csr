import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-confirm-dialog',
  imports: [SharedModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  @Input() message = '';
  @Input() busy = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly CONSTANTS = CONSTANTS;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy) this.cancelled.emit();
  }
}
