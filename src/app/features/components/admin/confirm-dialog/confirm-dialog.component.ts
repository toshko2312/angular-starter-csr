import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output,
  type OnInit,
} from '@angular/core';
import { ScrollLockService } from '@core/services/scroll-lock.service';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-confirm-dialog',
  imports: [SharedModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  private scrollLock = inject(ScrollLockService);

  @Input() message = '';
  @Input() busy = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly CONSTANTS = CONSTANTS;

  ngOnInit(): void {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.release();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy) this.cancelled.emit();
  }
}
