import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The Instagram and Facebook links, as their own component so the two inline
 * SVGs live in one place: the navbar shows them on desktop, and the contacts
 * page shows them on mobile, where the bar has no room.
 *
 * No stylesheet — `.social-wrapper` and friends are global (styles.scss), and
 * the anchors size off `var(--navbar-control, 42px)`, so they shrink to the
 * bar's control size inside the navbar and fall back to 42px elsewhere.
 */
@Component({
  selector: 'app-social-links',
  templateUrl: './social-links.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLinksComponent {}
