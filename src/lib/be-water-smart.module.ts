import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {TranslateModule} from "@ngx-translate/core";
import {WisdomModule} from "common";

import {BeWaterSmartComponent} from "./be-water-smart.component";



@NgModule({
  declarations: [
    BeWaterSmartComponent
  ],
  imports: [
    WisdomModule,
    TranslateModule,
    CommonModule,
    FormsModule
  ],
  exports: [
    BeWaterSmartComponent
  ]
})
export class BeWaterSmartModule { }
