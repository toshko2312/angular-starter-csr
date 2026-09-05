import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  Input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Dropdown wearing the app's own panel/option look, in place of a native
 * <select> whose option list is drawn by the OS and cannot be styled. The
 * trigger deliberately mirrors `.field input` so it lines up with the inputs
 * beside it.
 */
@Component({
  selector: 'app-select',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  /**
   * A signal input, not @Input: the options often arrive after the form value
   * (categories are fetched asynchronously), and selectedLabel below has to
   * recompute when they land or the trigger keeps showing the placeholder.
   */
  readonly options = input.required<SelectOption[]>();
  @Input() placeholder = '';
  @Input() inputId = '';
  /** Labels are translation keys (contacts) rather than literals (categories). */
  @Input() translateLabels = false;

  private readonly host = inject(ElementRef<HTMLElement>);

  readonly open = signal(false);
  readonly value = signal('');
  readonly disabled = signal(false);
  /** Index the keyboard is sitting on; -1 when nothing is highlighted. */
  readonly highlighted = signal(-1);

  readonly selectedLabel = computed(() => {
    const current = this.value();
    return this.options().find((option) => option.value === current)?.label ?? '';
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  select(option: SelectOption): void {
    this.value.set(option.value);
    this.onChange(option.value);
    this.close();
  }

  isSelected(option: SelectOption): boolean {
    return option.value === this.value();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    switch (event.key) {
      case 'Escape':
        if (this.open()) {
          event.stopPropagation();
          this.close();
        }
        return;
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) {
          this.openPanel();
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const count = this.options().length;
        if (!count) return;
        this.highlighted.set((this.highlighted() + step + count) % count);
        return;
      }
      case 'Enter':
      case ' ': {
        // The trigger is a button, so Enter/Space would submit or re-toggle.
        event.preventDefault();
        const option = this.options()[this.highlighted()];
        if (this.open() && option) this.select(option);
        else this.toggle();
        return;
      }
    }
  }

  private openPanel(): void {
    this.highlighted.set(this.options().findIndex((option) => option.value === this.value()));
    this.open.set(true);
  }

  private close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.highlighted.set(-1);
    this.onTouched();
  }
}
