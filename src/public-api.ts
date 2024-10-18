/*
 * Public API Surface of be-water-smart
 */

import { WisdomInterface } from "common";

import de_DE from "./lib/i18n/de_DE";
import en_US from "./lib/i18n/en_US";


import { BeWaterSmartComponent } from "./lib/be-water-smart.component";

export const wisdomInterface: WisdomInterface = {
  route: {
    path: 'be-water-smart',
    component: BeWaterSmartComponent,
  },
  scopes: [],
  translations: {
    de_DE,
    en_US,
  },
};

export * from './lib/be-water-smart.service';
export * from './lib/be-water-smart.component';
export * from './lib/be-water-smart.module';