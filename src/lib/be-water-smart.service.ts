import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from "@angular/common/http";
import { USE_API_URL, USE_LOADER, USE_ERROR_HANDLER } from 'common';
import { AllPhysicalMeters, AllVirtualMeters, AllAlgorithms, AllModels, VirtualMeter, ForeCast, PhysicalMeter } from './bws-interfaces';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class BeWaterSmartService {

  // the prefix to use in order to reach the BeWaterSmart api
  api_prefix = "bws";

  // httpContext with base values
  ctx: HttpContext = new HttpContext()
    .set(USE_API_URL, true)
    .set(USE_LOADER, false)
    .set(USE_ERROR_HANDLER, 1);

  constructor(private http: HttpClient) { }

  /**
   * generalized request method for bws api
   * @param method to use for request
   * @param url string as api endpoint
   * @param ctx additional information about request
   * @param requestBody bonus information in post and put requests
   * @returns an Observable with the set interface
   */
  sendRequest<T>(method: 'get' | 'post' | 'put' | 'delete', url: string, ctx?: HttpContext, requestBody?: any) {

    let finalUrl = this.api_prefix + url;
    let finalCtx = ctx || this.ctx;

    let requestOptions: any = {
      context: finalCtx,
      responseType: 'json',
      body: requestBody
    };

    return this.http.request<T>(method, finalUrl, requestOptions) as Observable<T>;
  }

  getDebugMessage() {
    return this.sendRequest("get", "/debug")
  }

  getPhysicalMeters() {
    return this.sendRequest<AllPhysicalMeters>("get", "/physical-meters")
  }

  getVirtualMeters() {
    return this.sendRequest<AllVirtualMeters>("get", "/virtual-meters")
  }

  getAlgorithms() {
    return this.sendRequest<AllAlgorithms>("get", "/algorithms");
  }

  getModels() {
    return this.sendRequest<AllModels>("get", "/models");

  }

  getCreateForecast(meterId: string, alg: string): Observable<ForeCast[]> {
    let url = "/meters/" + meterId + "/forecast" + "?algorithm=" + alg

    return this.sendRequest<ForeCast[]>("get", url);
  }

  addVirtualMeterWithId(id: string, submeters: any) {
    let url = "/virtual-meters?name=" + id;

    return this.sendRequest<AllVirtualMeters>("post", url, this.ctx, submeters);
  }

  delVirtualMeterById(input: string) {
    let url = "/virtual-meters/" + input

    return this.sendRequest("delete", url);
  }

  putTrainModel(meter: VirtualMeter, input: Algorithm, comment?: string) {
    let virt = meter.id.toString();
    let alg = input.name.toString();

    let url = "/meters/" + virt + "/models/" + alg;

    if (comment) {
      url = url + "?comment=" + comment;
    }

    let ctx: HttpContext = new HttpContext()
      .set(USE_API_URL, true)
      .set(USE_LOADER, true)
      .set(USE_ERROR_HANDLER, 1);

    return this.sendRequest<AllModels>("put", url, ctx);
  }

  delModel(meter: string, alg: string) {

    let url = "/models/" + meter + ":MLModel:" + alg;

    return this.sendRequest("delete", url);
  }


}

