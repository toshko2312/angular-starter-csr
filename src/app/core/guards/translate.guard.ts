import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { CONSTANTS } from "@shared/constants";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TranslationLoaderGuard {
  CONSTANTS = CONSTANTS
    constructor(private translate: TranslateService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

        return new Observable((observer) => {
            this.translate.get(CONSTANTS.DEFAULT_WEBSITE_TITLE).subscribe({
                next: () => {
                    observer.next(true);
                },
                error: error => {
                    observer.next(false);
                    observer.error(error);
                },
                complete: () => {
                    observer.complete();
                },
            })
        })
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return new Observable((observer) => {
            this.translate.get(CONSTANTS.DEFAULT_WEBSITE_TITLE).subscribe({
                next: () => {
                    observer.next(true);
                },
                error: error => {
                    observer.next(false);
                    observer.error(error);
                },
                complete: () => {
                    observer.complete();
                },
            })
        })
    }

}
