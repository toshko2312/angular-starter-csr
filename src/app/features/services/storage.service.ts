import { Injectable } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { CONSTANTS } from '@shared/constants';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly bucket = CONSTANTS.STORAGE_BUCKET;

  /** Uploads a file and resolves to its public URL. */
  upload(file: File, folder: string): Observable<string> {
    const extension = file.name.split('.').pop() || 'bin';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    return from(
      supabase.storage.from(this.bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return supabase.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
      })
    );
  }
}
