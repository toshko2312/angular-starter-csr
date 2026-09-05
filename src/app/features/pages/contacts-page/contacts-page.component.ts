import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { JsonLdService } from '@core/services/json-ld.service';
import { LanguageService } from '@core/services/language.service';
import { SeoService } from '@core/services/seo.service';
import { CONSTANTS } from '@shared/constants';
import { CartLine } from '@shared/models/cart.model';
import { EnquiryModel } from '@shared/models/enquiry.model';
import { SocialLinksComponent } from '@shared/components/social-links/social-links.component';
import { SharedModule } from '@shared/shared.module';
import { DatePicker } from 'primeng/datepicker';
import { TimePickerComponent } from '@shared/components/time-picker/time-picker.component';
import { startOfToday, toIsoDate } from '@shared/utils/date';
import { localized } from '@shared/utils/localized';
import { priceWithUnit } from '@shared/utils/money';
import { CartService } from '../../services/cart.service';
import { EnquiriesService } from '../../services/enquiries.service';

@Component({
  selector: 'app-contacts-page',
  imports: [SharedModule, DatePicker, TimePickerComponent, SocialLinksComponent],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPageComponent {
  private fb = inject(FormBuilder);
  private enquiries = inject(EnquiriesService);
  private translate = inject(TranslateService);
  private language = inject(LanguageService);
  private seo = inject(SeoService);
  private jsonLd = inject(JsonLdService);

  constructor() {
    effect(() => {
      this.language.current();
      this.seo.apply({
        titleKey: CONSTANTS.SEO_CONTACTS_TITLE,
        descriptionKey: CONSTANTS.SEO_CONTACTS_DESCRIPTION,
        page: CONSTANTS.CONTACTS_PAGE,
      });
      this.jsonLd.set('contact', {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: this.translate.instant(CONSTANTS.SEO_CONTACTS_TITLE),
        inLanguage: this.language.current(),
        about: { '@id': CONSTANTS.SITE_ORIGIN + '/#business' },
      });
    });
  }

  readonly CONSTANTS = CONSTANTS;
  /** No enquiring about an event that already happened. */
  readonly today = startOfToday();
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

  /** The keys above, shaped for <app-select>, which translates them itself. */
  readonly eventTypeOptions = this.eventTypes.map((type) => ({ value: type, label: type }));

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    // A Date for the picker; serialised to 'yyyy-MM-dd' on submit.
    event_date: [null as Date | null],
    // 'HH:mm' straight from the picker — what a Postgres `time` takes.
    event_time: [null as string | null],
    event_time_unknown: [false],
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

  nameOf(line: CartLine): string {
    return localized(line.item.name, line.item.name_en, this.language.current());
  }

  detailOf(line: CartLine): string {
    return priceWithUnit(line.lineTotal, line.item.unit);
  }

  /**
   * Disabling the control is what greys the picker out and keeps its value
   * out of getRawValue's way; the flag is what the admin panel reads.
   */
  toggleTimeUnknown(): void {
    const unknown = !this.form.controls.event_time_unknown.value;
    this.form.controls.event_time_unknown.setValue(unknown);

    const time = this.form.controls.event_time;
    time.setValue(null);
    unknown ? time.disable() : time.enable();
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
      event_date: raw.event_date ? toIsoDate(raw.event_date) : null,
      // The toggle already clears the control; belt and braces, so a time
      // can never travel with the flag set.
      event_time: raw.event_time_unknown ? null : raw.event_time,
      event_type: this.translate.instant(raw.event_type),
      cart_lines: this.cart.toEnquiryLines(),
    };

    this.submitting.set(true);
    this.error.set(false);

    this.enquiries.submit(enquiry).subscribe({
      next: () => {
        this.submitting.set(false);
        // Counted before clearing — the sent note reports what was attached.
        this.sentCount.set(this.cart.count());
        this.cart.clear();
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
    // enable() first: a disabled control is skipped by reset().
    this.form.controls.event_time.enable();
    this.form.reset({ event_type: this.eventTypes[0] });
    this.cart.clear();
    this.sent.set(false);
    this.error.set(false);
  }
}
