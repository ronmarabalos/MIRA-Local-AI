type Shades = { readonly [shade: string]: string };

declare const palette: {
  readonly white: string;
  readonly black: string;
  readonly transparent: string;
  readonly silk: Shades;
  readonly ink: Shades;
  readonly navy: Shades;
  readonly peri: Shades;
  readonly mint: Shades;
  readonly success: Shades;
  readonly warning: Shades;
  readonly error: Shades;
  readonly outlook: Shades;
  readonly dk: Shades;
};

export = palette;
