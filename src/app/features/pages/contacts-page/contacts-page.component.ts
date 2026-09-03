import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';
import { CartLine } from '@shared/models/cart.model';
import { EnquiryModel } from '@shared/models/enquiry.model';
import { SharedModule } from '@shared/shared.module';
import { money } from '@shared/utils/money';
import { CartService } from '../../services/cart.service';
import { EnquiriesService } from '../../services/enquiries.service';

@Component({
  selector: 'app-contacts-page',
  imports: [SharedModule],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPageComponent {
  private fb = inject(FormBuilder);
  private enquiries = inject(EnquiriesService);
  private translate = inject(TranslateService);

  readonly CONSTANTS = CONSTANTS;
  readonly cart = inject(CartService);

  readonly sent = signal(false);
  readonly sentCount = signal(0);
  readonly submitting = signal(false);
  readonly error = signal(false);

  readonly eventTypes = [
    'CONTACTS.EVENT_TYPES.WEDDING',
    'CONTACTS.EVENT_TYPES.CORPORATE',
    'CONTACTS.EVENT_TYPES.BIRTHDAY',
    'CONTACTS.EVENT_TYPES.COCKTAIL',
    'CONTACTS.EVENT_TYPES.OTHER',
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    event_date: [''],
    guests: [null as number | null],
    event_type: [this.eventTypes[0]],
    location: [''],
    message: ['', Validators.required],
  });

  /** Mirrors the design's attach line, which changes with the cart. */
  attachLabel(): string {
    if (this.cart.isEmpty()) {
      return this.translate.instant(CONSTANTS.CONTACTS_ATTACH_EMPTY);
    }
    return this.translate.instant(CONSTANTS.CONTACTS_ATTACH_WITH_CART, {
      count: this.cart.count(),
      total: this.cart.totalLabel(),
    });
  }

  sentNote(): string {
    const count = this.sentCount();
    return count
      ? this.translate.instant(CONSTANTS.CONTACTS_SENT_WITH_CART, { count })
      : this.translate.instant(CONSTANTS.CONTACTS_SENT_PLAIN);
  }

  detailOf(line: CartLine): string {
    return `${money(line.lineTotal)} · ${line.item.unit}`;
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const enquiry: EnquiryModel = {
      ...raw,
      event_date: raw.event_date || null,
      event_type: this.translate.instant(raw.event_type),
      cart_lines: this.cart.toEnquiryLines(),
    };

    this.submitting.set(true);
    this.error.set(false);

    this.enquiries.submit(enquiry).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sentCount.set(this.cart.count());
        this.sent.set(true);
      },
      error: (err) => {
        console.error('Error submitting enquiry:', err);
        this.submitting.set(false);
        this.error.set(true);
      },
    });
  }

  reset(): void {
    this.form.reset({ event_type: this.eventTypes[0] });
    this.cart.clear();
    this.sent.set(false);
    this.error.set(false);
  }
}
