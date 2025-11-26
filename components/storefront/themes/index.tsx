import type { ReactElement } from "react";
import type { ThemeRendererProps } from "../theme-renderer";
import { BlackFridayTheme } from "./black-friday-mega-sale";
import { FitnessBoutiqueTheme } from "./fitness-boutique";
import { EducationDigitalCampusTheme } from "./education-digital-campus";

type ThemeComponent = (props: ThemeRendererProps) => ReactElement;

export const themeComponents: Record<string, ThemeComponent> = {
  "black-friday-mega-sale": BlackFridayTheme,
  "fitness-boutique": FitnessBoutiqueTheme,
  "education-digital-campus": EducationDigitalCampusTheme,
};
