import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Injector,
  Input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';

/** Quarter hours; anything finer is noise for an event start time. */
const MINUTE_STEP = 15;

/**
 * Hour/minute picker wearing the app's own panel look, in place of
 * <input type="time"> whose popup is drawn by the browser and cannot be
 * styled — the same reason the date field became a themed PrimeNG picker.
 *
 * The trigger deliberately mirrors `.field input` (via the same rules as
 * <app-select>) so it lines up with the controls beside it.
 */
@Component({
  selector: 'app-time-picker',
  imports: [TranslatePipe],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
})
export class TimePickerComponent implements ControlValueAccessor {
  @Input() inputId = '';
  /** Shown when no time is picked yet. */
  @Input() placeholder = '--:--';

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  readonly CONSTANTS = CONSTANTS;

  readonly hours = Array.from({ length: 24 }, (_, hour) => pad(hour));
  readonly minutes = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => pad(index * MINUTE_STEP));

  readonly open = signal(false);
  readonly disabled = signal(false);
  /** 'HH:mm', or '' while nothing is picked. */
  readonly value = signal('');
  /**
   * A minute clicked before any hour. Held rather than emitted: ':30' on its
   * own is not a time.
   */
  private readonly pendingMinute = signal('');

  readonly hour = computed(() => this.value().split(':')[0] ?? '');
  readonly minute = computed(() => this.value().split(':')[1] || this.pendingMinute());

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    // Postgres hands back 'HH:mm:ss'; the picker only deals in hours and
    // minutes, so seconds are trimmed on the way in.
    this.value.set(value ? value.slice(0, 5) : '');
    this.pendingMinute.set('');
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) this.open.set(false);
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  /** One click is enough: an hour with no minute yet means the top of it. */
  selectHour(hour: string): void {
    this.commit(hour, this.minute() || '00');
  }

  selectMinute(minute: string): void {
    const hour = this.hour();
    if (!hour) {
      this.pendingMinute.set(minute);
      return;
    }
    this.commit(hour, minute);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (!this.open()) return;
    event.stopPropagation();
    this.close();
  }

  private commit(hour: string, minute: string): void {
    this.pendingMinute.set('');
    this.value.set(`${hour}:${minute}`);
    this.onChange(this.value());
  }

  private openPanel(): void {
    this.open.set(true);
    // The list is 24 rows tall, so an evening time would otherwise open out of
    // sight. afterNextRender rather than a timeout: change detection is
    // coalesced onto an animation frame (see provideZoneChangeDetection in
    // app.config.ts), so a macrotask still runs before the panel exists.
    afterNextRender(() => this.scrollToSelectedHour(), { injector: this.injector });
  }

  /**
   * Scrolls the column itself rather than calling scrollIntoView, which would
   * also scroll the page and jerk the form under the reader.
   */
  private scrollToSelectedHour(): void {
    const host = this.host.nativeElement as HTMLElement;
    const column = host.querySelector<HTMLElement>('.time-column');
    const selected = column?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!column || !selected) return;

    const columnBox = column.getBoundingClientRect();
    const cellBox = selected.getBoundingClientRect();
    column.scrollTop += cellBox.top - columnBox.top - (columnBox.height - cellBox.height) / 2;
  }

  private close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.pendingMinute.set('');
    this.onTouched();
  }
}

function pad(value: number): string {
  return `${value}`.padStart(2, '0');
}
