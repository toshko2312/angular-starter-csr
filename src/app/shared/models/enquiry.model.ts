export interface EnquiryCartLine {
  id: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
  /** Snapshot taken at send time; rows stored before this are missing it. */
  image_path?: string | null;
}

export interface EnquiryModel {
  name: string;
  email: string;
  phone: string;
  event_date: string | null;
  /** 'HH:mm', or null when unset or explicitly unknown. */
  event_time: string | null;
  /** The sender said the time is not decided yet — not the same as unset. */
  event_time_unknown: boolean;
  guests: number | null;
  event_type: string;
  location: string;
  message: string;
  cart_lines: EnquiryCartLine[];
}

/**
 * A row as it comes back from the table. EnquiryModel above stays the insert
 * payload the contact form sends; these columns are filled in by Postgres or
 * by the admin panel.
 */
export interface EnquiryRecord extends EnquiryModel {
  id: string;
  created_at: string;
  handled: boolean;
  handled_at: string | null;
}
