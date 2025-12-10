/**
 * Design token mapper for @react-pdf/renderer
 * Maps Materna360 soft luxury tokens → PDF styles
 */

export const pdfTheme = {
  // Colors (RGB values converted to hex for PDF)
  colors: {
    primary: '#fd2597',        // Pink Materna360
    primaryWeak: '#fdbed7',    // Rosa suave
    ink1: '#545454',           // texto principal
    ink2: '#6A6A6A',           // texto suave
    white: '#FFFFFF',
    softBg: '#ffe1f1',         // Pink Snow
    border: '#F5D7E5',         // border soft
    borderLight: 'rgba(255, 225, 241, 0.8)',
  },

  // Spacing (8px grid)
  spacing: {
    xs: 8,
    s: 12,
    m: 16,
    l: 24,
    xl: 32,
  },

  // Border radius (soft luxury)
  radius: {
    card: 20,
    cardLg: 24,
    pill: 999,
  },

  // Typography ramp (Poppins primary, Quicksand secondary)
  fonts: {
    primary: 'Poppins',
    secondary: 'Quicksand',
  },

  typography: {
    // Display/Title
    display: {
      fontSize: 28,
      lineHeight: 1.2,
      fontWeight: 700,
      fontFamily: 'Poppins',
    },
    // H1
    h1: {
      fontSize: 24,
      lineHeight: 1.28,
      fontWeight: 600,
      fontFamily: 'Poppins',
    },
    // H2
    h2: {
      fontSize: 20,
      lineHeight: 1.35,
      fontWeight: 600,
      fontFamily: 'Poppins',
    },
    // H3
    h3: {
      fontSize: 16,
      lineHeight: 1.4,
      fontWeight: 600,
      fontFamily: 'Poppins',
    },
    // Body
    body: {
      fontSize: 14,
      lineHeight: 1.5,
      fontWeight: 400,
      fontFamily: 'Quicksand',
    },
    // Body small
    bodySm: {
      fontSize: 12,
      lineHeight: 1.5,
      fontWeight: 400,
      fontFamily: 'Quicksand',
    },
    // Meta/caption
    meta: {
      fontSize: 10,
      lineHeight: 1.4,
      fontWeight: 500,
      fontFamily: 'Poppins',
    },
  },

  // Page setup
  page: {
    marginTop: 40,
    marginBottom: 40,
    marginLeft: 40,
    marginRight: 40,
    size: 'A4', // 210 x 297mm
  },

  // Shadows (for styling reference, not directly used in PDF)
  shadows: {
    card: '0 8px 28px rgba(0, 0, 0, 0.08)',
    cardHover: '0 12px 40px rgba(0, 0, 0, 0.12)',
  },
};

// Common style objects for reuse
export const pdfStyles = {
  // Cover section
  cover: {
    paddingTop: 80,
    paddingBottom: 60,
    marginBottom: 40,
    borderBottom: `2px solid ${pdfTheme.colors.primaryWeak}`,
  },

  // Page number footer
  pageNumber: {
    fontSize: 10,
    color: pdfTheme.colors.ink2,
    textAlign: 'center' as const,
    marginTop: 20,
  },

  // Table of contents
  toc: {
    marginBottom: 40,
  },
  tocEntry: {
    marginBottom: 8,
    fontSize: 12,
    color: pdfTheme.colors.ink1,
  },
  tocLabel: {
    color: pdfTheme.colors.ink2,
    fontSize: 10,
    marginRight: 4,
  },

  // Data visualization placeholder
  chart: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: pdfTheme.colors.softBg,
    borderRadius: pdfTheme.radius.card,
    minHeight: 200,
  },

  // Card/section
  card: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: pdfTheme.colors.white,
    border: `1px solid ${pdfTheme.colors.border}`,
    borderRadius: pdfTheme.radius.card,
  },

  // Metrics row
  metricsRow: {
    display: 'flex',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: `1px solid ${pdfTheme.colors.borderLight}`,
  },

  // Highlight/emphasis
  highlight: {
    color: pdfTheme.colors.primary,
    fontWeight: 600,
  },
};
