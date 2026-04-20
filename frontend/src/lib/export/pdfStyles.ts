export interface PDFTypography {
  primary: {
    family: string;
    size: number;
    weight: 'normal' | 'bold';
    color: [number, number, number];
  };
  secondary: {
    family: string;
    size: number;
    weight: 'normal' | 'bold';
    color: [number, number, number];
  };
  body: {
    family: string;
    size: number;
    lineHeight: number;
    color: [number, number, number];
  };
  caption: {
    family: string;
    size: number;
    color: [number, number, number];
  };
}

export interface PDFColors {
  primary: [number, number, number];
  secondary: [number, number, number];
  text: [number, number, number];
  textLight: [number, number, number];
  border: [number, number, number];
  background: [number, number, number];
  accent: [number, number, number];
}

export const blueprintPDFStyles: PDFTypography = {
  primary: {
    family: 'helvetica',
    size: 24,
    weight: 'bold',
    color: [15, 23, 42], // slate-900
  },
  secondary: {
    family: 'helvetica',
    size: 18,
    weight: 'bold',
    color: [51, 65, 85], // slate-700
  },
  body: {
    family: 'helvetica',
    size: 11,
    lineHeight: 1.6,
    color: [71, 85, 105], // slate-600
  },
  caption: {
    family: 'helvetica',
    size: 9,
    color: [148, 163, 184], // slate-400
  },
};

export const blueprintPDFColors: PDFColors = {
  primary: [15, 23, 42], // slate-900
  secondary: [51, 65, 85], // slate-700
  text: [71, 85, 105], // slate-600
  textLight: [148, 163, 184], // slate-400
  border: [226, 232, 240], // slate-200
  background: [248, 250, 252], // slate-50
  accent: [59, 130, 246], // blue-500
};

export interface PDFMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const defaultMargins: PDFMargins = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

export interface PDFPageConfig {
  format: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  unit: 'mm' | 'pt' | 'px';
}

export const defaultPageConfig: PDFPageConfig = {
  format: 'A4',
  orientation: 'portrait',
  unit: 'mm',
};
