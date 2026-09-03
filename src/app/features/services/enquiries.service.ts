import { Injectable } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { EnquiryModel } from '@shared/models/enquiry.model';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EnquiriesService {
  submit(enquiry: EnquiryModel): Observable<boolean> {
    return from(supabase.from('enquiries').insert(enquiry)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return true;
      })
    );
  }
}
