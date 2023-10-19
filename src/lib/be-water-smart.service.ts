import {HttpClient, HttpContext} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {USE_API_URL, USE_LOADER, USE_ERROR_HANDLER} from "common";
import {Observable} from "rxjs";

import {
  AllAlgorithms,
  ForeCast,
  VirtualMeter,
  AllPhysicalMeters,
  AllVirtualMeters,
  AllModels
} from "./bws-interfaces";

/**
 * constant holding the api prefix to reach the bws api
 */
const API_PREFIX = "bws";

@Injectable({
  providedIn: 'root'
})
export class BeWaterSmartService {

  /**
   * http context for further information to the request.
   */
  ctx: HttpContext = new HttpContext()
    .set(USE_API_URL, true)
    .set(USE_LOADER, false)
    .set(USE_ERROR_HANDLER, 1);

  constructor(private http: HttpClient, private router: Router) { }

  /**
   * generalized request method for bws api
   * @param method to use for request
   * @param url string as api endpoint
   * @param ctx additional information about request
   * @param requestBody bonus information in post and put requests
   * @returns an Observable with the set interface
   */
  sendRequest<T>(method: 'get' | 'post' | 'put' | 'delete', url: string, ctx?: HttpContext, requestBody?: any) {

    // FIXME continue here
    let finalUrl = this.router.parseUrl(API_PREFIX + url);
    let finalCtx = ctx || this.ctx;

    let requestOptions: any = {
      context: finalCtx,
      responseType: 'json',
      body: requestBody
    };

    return this.http.request<T>(method, finalUrl.toString(), requestOptions) as Observable<T>;
  }

  /**
   * uses send request method to test the reachability of bws api
   * @returns success message or http error
   */
  getDebugMessage() {
    return this.sendRequest("get", "/debug")
  }

  /**
   * requests physical meter information from bws api
   * @returns observable containing list of all pm information
   */
  getPhysicalMeters() {
    return this.sendRequest<AllPhysicalMeters>("get", "/physical-meters")
  }

  /**
   * requests virtual meter information from bws api
   * @returns observable containing list of all vm information
   */
  getVirtualMeters() {
    return this.sendRequest<AllVirtualMeters>("get", "/virtual-meters")
  }

  /**
   * requests all algorithms provided by bws api
   * @returns observable containing list of all algorithms
   */
  getAlgorithms() {
    return this.sendRequest<AllAlgorithms>("get", "/algorithms");
  }

  /**
   * requests all trained models from bws api
   * @returns observable containing list of all trained models
   */
  getModels() {
    return this.sendRequest<AllModels>("get", "/models");
  }

  /**
   * request the forecast data to create a graph from bws api
   * @param meterId id of the virtual meter being used
   * @param alg name of the algorithm being used
   * @returns observable containing all measuring points for the next day
   */
  getCreateForecast(meterId: string, alg: string): Observable<ForeCast[]> {
    let url = "/meters/" + meterId + "/forecast" + "?algorithm=" + alg

    return this.sendRequest<ForeCast[]>("get", url);
  }

  /**
   * posts a request to bws api in order to create a new virtual meter
   * @param id name of the virtual meter
   * @param submeters all physical meters contained by the virtual meter
   * @returns observable containing a success or http error msg
   */
  addVirtualMeterWithId(id: string, submeters: any) {
    let url = "/virtual-meters?name=" + id;

    return this.sendRequest<AllVirtualMeters>("post", url, this.ctx, submeters);
  }

  /**
   * deletes virtual meter per id from the bws api
   * @param input the name of virtual meter to be deleted
   * @returns observable containing success or http error msg
   */
  delVirtualMeterById(input: string) {
    let url = "/virtual-meters/" + input

    return this.sendRequest("delete", url);
  }

  /**
   * train a new model via bws api using loading bar in http context,
   * because of long execution time.
   * -> every virtual meter can only hold a single model in combination with a
   * algorithm
   * @param meter virtual meter to be used as training data
   * @param input the algorithm to train
   * @param comment string to identify the trained model afterwards
   * @returns observable containing all training data in a list
   */
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

  /**
   * delete request for the bws api.
   * as requested by the api itself, you cant reference a model directly, but rather have to type in the 
   * virtual meter and algorithm used and the api tracks down, which model it could be. Don't know why.
   * @param meter name of the virtual meter which got used to train the model
   * @param alg algorithm trained in the model
   * @returns observable containing success or http error msg
   */
  delModel(meter: string, alg: string) {

    let url = "/models/" + meter + ":MLModel:" + alg;

    return this.sendRequest("delete", url);
  }


}

