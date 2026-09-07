import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

/**
 * Loading state built from the site's own logo: the cloche lid dips, lifts off
 * with steam rising, then falls back with a squash settle while the wordmark
 * wipes in from the left and back out to the right. 2.5s loop.
 *
 * Pure CSS keyframes — a loading indicator should not schedule JS work, and
 * keyframes survive prerender and hydration without a mismatch.
 *
 * The three layers are alpha silhouettes split out of public/logo-mark.png by
 * connected component, each on the same 320x227 canvas, so they stack at
 * inset 0 and only the lid needs a transform.
 */
@Component({
  selector: 'app-loading-animation',
  imports: [SharedModule],
  templateUrl: './loading-animation.component.html',
  styleUrl: './loading-animation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingAnimationComponent {
  readonly CONSTANTS = CONSTANTS;

  /** Overrides the default "Зареждане" / "Loading" label key. */
  @Input() labelKey = CONSTANTS.LOADING_LABEL;
}
