import { Injectable } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { CONSTANTS } from '@shared/constants';
import { optimizeImage } from '@shared/utils/image-optimizer';
import { from, map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly bucket = CONSTANTS.STORAGE_BUCKET;

  /**
   * Uploads a file and resolves to its public URL. Every picked image is
   * downscaled and re-encoded first (see optimizeImage) — done here rather
   * than in the dialogs so both of them get it, and so no future caller can
   * forget.
   */
  upload(file: File, folder: string): Observable<string> {
    return from(optimizeImage(file)).pipe(
      switchMap((optimized) => {
        const extension = optimized.name.split('.').pop() || 'bin';
        const path = `${folder}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${extension}`;

        return from(
          supabase.storage.from(this.bucket).upload(path, optimized, {
            cacheControl: '3600',
            upsert: false,
          })
        ).pipe(
          map((result) => {
            if (result.error) throw result.error;
            return supabase.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
          })
        );
      })
    );
  }
}
