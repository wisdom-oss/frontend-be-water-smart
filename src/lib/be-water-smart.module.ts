import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { WisdomModule } from "common";
import { NgChartsModule } from 'ng2-charts';
import { BeWaterSmartComponent } from "./be-water-smart.component";



@NgModule({
  declarations: [
    BeWaterSmartComponent
  ],
  imports: [
    WisdomModule,
    TranslateModule,
    CommonModule,
    FormsModule,
    NgChartsModule
  ],
  exports: [
    BeWaterSmartComponent
  ]
})
export class BeWaterSmartModule { }
