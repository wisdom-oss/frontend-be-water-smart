import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from "@angular/common/http";
import { USE_API_URL, USE_LOADER, USE_ERROR_HANDLER } from 'common';
import { AllPhysicalMeters, AllVirtualMeters, PhysicalMeter, VirtualMeter } from './bws-interfaces';



@Injectable({
  providedIn: 'root'
})
export class BeWaterSmartService {

  // the prefix to use in order to reach the BeWaterSmart api
  api_prefix = "bws/";

  // httpContext with base values
  ctx: HttpContext = new HttpContext()
    .set(USE_API_URL, true)
    .set(USE_LOADER, false)
    .set(USE_ERROR_HANDLER, 1);

  constructor(private http: HttpClient) { }

  getDebugMessage() {
    let url = this.api_prefix + "/debug";

    return this.http.get(url, {
      responseType: "json",
      context: this.ctx,
    })
  }

  getPhysicalMeters() {
    let url = this.api_prefix + "/physical-meters";

    return this.http.get<AllPhysicalMeters>(url, {
      context: this.ctx,
      responseType: "json",
    })
  }

  getVirtualMeters() {
    let url = this.api_prefix + "/virtual-meters";

    return this.http.get<AllVirtualMeters>(url, {
      context: this.ctx,
      responseType: "json",
    })
  }

  getPhysicalMeterById(input: string) {
    let url = this.api_prefix + "/physical-meters" + input

    return this.http.get(url, {
      context: this.ctx,
      responseType: "json",
    })
  }

  delVirtualMeterById(input: string) {
    let url = this.api_prefix + "/virtual-meters/" + input

    return this.http.delete(url, {
      context: this.ctx,
      responseType: "json",
    })
  }


}

