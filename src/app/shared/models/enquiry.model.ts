export interface EnquiryCartLine {
  id: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
}

export interface EnquiryModel {
  name: string;
  email: string;
  phone: string;
  event_date: string | null;
  guests: number | null;
  event_type: string;
  location: string;
  message: string;
  cart_lines: EnquiryCartLine[];
}
