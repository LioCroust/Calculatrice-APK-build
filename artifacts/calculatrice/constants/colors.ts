/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#f8f9fa',
    tint: '#8ab4f8',

    // Core surfaces
    background: '#202124',
    foreground: '#f8f9fa',

    // Cards / elevated surfaces
    card: '#303134',
    cardForeground: '#f8f9fa',

    // Primary action color (buttons, links, active states)
    primary: '#8ab4f8',
    primaryForeground: '#202124',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#303134',
    secondaryForeground: '#f8f9fa',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#3c4043',
    mutedForeground: '#bdc1c6',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#d2e3fc',
    accentForeground: '#202124',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#3c4043',
    input: '#303134',
  },
  dark: {
    text: '#f8f9fa',
    tint: '#8ab4f8',
    background: '#202124',
    foreground: '#f8f9fa',
    card: '#303134',
    cardForeground: '#f8f9fa',
    primary: '#8ab4f8',
    primaryForeground: '#202124',
    secondary: '#303134',
    secondaryForeground: '#f8f9fa',
    muted: '#3c4043',
    mutedForeground: '#bdc1c6',
    accent: '#d2e3fc',
    accentForeground: '#202124',
    destructive: '#f28b82',
    destructiveForeground: '#202124',
    border: '#3c4043',
    input: '#303134',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
