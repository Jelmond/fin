'use client'
import { CSSObject, createGlobalStyle, css } from "styled-components";
import { AdaptiveGrid } from "./AdaptiveGrid";

export interface Grid {
  [key: string]: number;
}

export const initSmartCSSGrid = <T extends Grid>({
  grid,
  related = {} as T,
  scaleUpCoeff = 0.6666,
  fontBase = 16,
}: { grid: T; related?: T, scaleUpCoeff?: number; fontBase?: number }) => {
  const breakpoints: Record<keyof T, string> = {} as Record<keyof T, string>;
  const fontSizes: Record<keyof T, string> = {} as Record<keyof T, string>;

  for (const key in grid) {
    breakpoints[key] = `${grid[key]}px`;
    fontSizes[key] = `${(fontBase * 100) / Number(related[key] || grid[key])}vw`;
  }

  const highestWidth = Math.max(...Object.values(grid));

  type Breakpoints = keyof typeof breakpoints;

  type Media = {
    [key in Breakpoints]: (...args: any) => CSSObject;
  };

  const rm = (value: number) => `${value / fontBase}rem`;
  const em = (value: number) => `${value / fontBase}em`;

  const media: Media = Object.keys(breakpoints).reduce((acc, label) => {
    //@ts-expect-error
    acc[label as Breakpoints] = (...args: [TemplateStringsArray, ...SimpleInterpolation[]]) => css`
      @media (max-width: ${breakpoints[label as Breakpoints]}) {
        ${css(...args)}
      }
    `;
    return acc;
  }, {} as Media);


  const PrintGrid = createGlobalStyle`
    html {
      font-size: ${fontBase}px;

      ${Object.keys(breakpoints).reduce((acc, curr) => {
        const value = `
          @media (max-width: ${breakpoints[curr]}) {
            font-size: ${fontSizes[curr]};
          }\n
        `;
        return acc + value;
      }, '')}
    }
  `;

  const SmartCSSGridComponent = () => (
    <>
      <AdaptiveGrid baseWidth={highestWidth} coef={scaleUpCoeff} />
      <PrintGrid />
    </>
  );

  return { SmartCSSGrid: SmartCSSGridComponent, media, rm, em };
};