import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { BeWaterSmartComponent } from './be-water-smart.component';
import { TranslateModule } from "@ngx-translate/core";
import { WisdomModule } from "common";
import { FormsModule } from '@angular/forms';



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
