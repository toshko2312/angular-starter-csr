import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * Aura, repainted in the site's own palette so PrimeNG overlays sit inside the
 * design rather than beside it. The ramp is built around --accent (#a8412a)
 * and --accent-hover (#8f351f) from styles.scss, so a selected day matches
 * .nav-pill--active and .dropdown-option--active.
 *
 * Structural styling (the glass panel) stays in styles.scss: PrimeNG is loaded
 * into a CSS layer, so plain app rules override it without !important.
 */
export const CateringPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fbf1ee',
      100: '#f3d9d2',
      200: '#e6b3a6',
      300: '#d98d7a',
      400: '#c3654c',
      500: '#a8412a',
      600: '#9a3a25',
      700: '#8f351f',
      800: '#762b19',
      900: '#5d2214',
      950: '#3d150c',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#a8412a',
          contrastColor: '#ffffff',
          hoverColor: '#8f351f',
          activeColor: '#8f351f',
        },
      },
    },
  },
});
