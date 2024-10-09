import { Component, OnInit } from "@angular/core";
import { BeWaterSmartService } from "./be-water-smart.service";
import { Chart, ChartType, ChartConfiguration } from "chart.js";
import { Observable } from "rxjs";
import {
  Algorithm,
  PhysicalMeter,
  VirtualMeter,
  MLModel
} from "./bws-interfaces";


@Component({
  selector: 'lib-be-water-smart',
  templateUrl: "be-water-smart.component.html",
  styleUrls: ['be-water-smart.css'
  ]
})
export class BeWaterSmartComponent implements OnInit {
  // ---------- Layout Parameters ----------

  /**
   * max number of characters per column
   */
  slice: number = 20;

  /**
   * box height physical meter display, table height in relation
   */
  heightPM: string = "30vh";
  heightPMTable: string = this.calcRelBoxHeight(this.heightPM, 0.5);

  /**
   * box height virtual meter display, table height in relation
   */
  heightVM: string = "60vh";
  heightVMTable: string = this.calcRelBoxHeight(this.heightVM, 0.55);

  /**
   * box height algorithm display, table height in relation
   */
  heightAlg: string = "65vh";
  heightAlgTable: string = this.calcRelBoxHeight(this.heightAlg, 0.7);

  /**
   * box height model meter display, table height in relation
   */
  heightModel: string = "50vh";
  heightModelTable: string = this.calcRelBoxHeight(this.heightModel, 0.8);

  /**
   * box height forecast graph, table height in relation
   */
  heightForecast: string = "50vh";
  heightForecastGraph: string = this.calcRelBoxHeight(this.heightForecast, 0.8);

  // ------------------------------ Chart Parameters --------------------------------------------

  // standard times of a day, used for x axis
  standardTimes: string[] = ['01:00:00', '02:00:00', '03:00:00',
    '04:00:00', '05:00:00', '06:00:00', '07:00:00',
    '08:00:00', '09:00:00', '10:00:00', '11:00:00',
    '12:00:00', '13:00:00', '14:00:00', '15:00:00',
    '16:00:00', '17:00:00', '18:00:00', '19:00:00',
    '20:00:00', '21:00:00', '22:00:00', '23:00:00']

  // type of chart
  chartType: ChartType = 'line';

  // datasets and labels to draw the chart
  chartData: ChartConfiguration['data'] = {
    labels: this.standardTimes,
    datasets: [
      {
        data: [],
        label: ""
      },
    ]
  }

  // further options to specify in the chart
  chartOptions: ChartConfiguration['options'] = {
    responsive: true
  };

  // ---------- Physical Meter Parameters ----------

  /**
   * list of physical meters | jsonobjects
   */
  pMeters: PhysicalMeter[] = [];

  /**
   * list of selected physical meters for virtual meter creation
   */
  selectedPhysicalMeters: PhysicalMeter[] = [];

  // ---------- Virtual Meter Parameters ----------

  /**
   * list of virtual meters | jsonobjects
   */
  vMeters: VirtualMeter[] = [];

  /**
   * selected virtual meter to train a model
   */
  selectedVirtualMeter: VirtualMeter | undefined;

  /**
   * name of potential new virtual meter
   */
  newVMeterName: string = "";

  // ---------- Algorithm Parameters ----------

  /**
   * list of all Algorithm
   */
  algorithms: Algorithm[] = [];

  /**
   * algorithm to train with a virtual meter
   */
  selectedAlgorithm: Algorithm | undefined;

  /**
   * all trained models
   */
  models: MLModel[] = [];

  /**
   * selected model for consumption forecast
   */
  selectedModel: MLModel | undefined;

  /**
   * comment to reidentify a model
   */
  modelComment: string | undefined;

  // ---------- Forecast Parameters ----------

  /**
   * chart variable holding a chart.js
   */
  chart: any;

  /**
   * variable determining if chart gets displayed
   */
  dataAvailable: boolean = false;

  constructor(public bwsService: BeWaterSmartService) { }

  ngOnInit(): void {
    // initialize all displays when rendering web page
    this.extractPMeters()
    this.extractVMeters();
    this.extractAlgorithms();
    this.extractModels();
  }

  // ---------- Extracting Functions ----------

  /**
   * Generic Extraction Method for B-Water-Smart
   * @param extractionMethod the function to use for the api call
   * @param responseField the field of the response to read
   * @param destinationField the parameter to save data to
   */
  extractData(extractionMethod: () => Observable<any>, responseField: string, destinationField: keyof this): void {
    extractionMethod().subscribe({
      next: (response) => {
        // Dynamically assign the response field to the destination field
        this[destinationField] = response[responseField];
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  /**
   * calls bws service to retrieve all physical meter information
   */
  extractPMeters(): void {
    this.extractData(
      () => this.bwsService.getPhysicalMeters(),
      'meters',
      'pMeters'
    );
  }

  /**
   * calls bws service to retrieve all virtual meter information
   */
  extractVMeters(): void {
    this.extractData(() => this.bwsService.getVirtualMeters(),
      'virtualMeters', 'vMeters')
  }

  /**
   * calls bws service to retrieve all algorithms
   */
  extractAlgorithms(): void {
    this.extractData(
      () => this.bwsService.getAlgorithms(),
      'algorithms',
      'algorithms'
    )
  }

  /**
   * calls bws service to retrieve all trained models
   */
  extractModels(): void {
    this.extractData(
      () => this.bwsService.getModels(),
      'MLModels',
      'models'
    )
  }

  // ---------- Checkbox Functions ----------


  /**
 * Check if a physicalMeter is selected for creation of a virtual meter
 * @param item the physicalMeter to be checked
 * @param event the event from checkbox
 */
  toggleSelectedPhysicalMeter(item: PhysicalMeter, event: Event) {

    // FIXME Necessary to have all this code? Other functions work without it aswell
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      this.selectedPhysicalMeters.push(item);
    } else {
      const index = this.selectedPhysicalMeters.findIndex(meter => meter.id === item.id);
      if (index !== -1) {
        this.selectedPhysicalMeters.splice(index, 1);
      }
    }
  }

  /**
  * toggle if checkboxes are available or not
  * @param item the meter currently selected
  */
  toggleSelectedVirtualMeter(item: any) {
    if (this.selectedVirtualMeter === item) {
      this.selectedVirtualMeter = undefined; // Untick the selected item
    } else {
      this.selectedVirtualMeter = item; // Tick the selected item
    }
  }

  /**
   * makes only one trained model selectable at a time for forecasting
   * @param item variable holding the checkbox information
   */
  toggleSelectedModel(item: any) {
    if (this.selectedModel === item) {
      this.selectedModel = undefined; // Untick the selected item
    } else {
      this.selectedModel = item; // Tick the selected item
    }
  }

  /**
   * save selected algorithm information to variable
   * @param input algorithm selected to use
   */
  chooseAlgorithm(input: Algorithm): void {
    this.selectedAlgorithm = input;
  }

  // ---------- VirtualMeterList Functions ----------

  /**
   * creates a new VMeter with an @input name and the id-list of the selected physical meters.
   * If successful, user gets informed and all global variables get set back.
   * If failed, user gets informed
   */
  addVMeter(): void {

    let id_list: string[] = [];

    this.selectedPhysicalMeters.forEach((item) => {
      id_list.push(item.id);
    });

    let jsonBody = { submeterIds: id_list };

    this.bwsService.addVirtualMeterWithId(this.newVMeterName, jsonBody).subscribe({
      next: (response) => {
        if (response.hasOwnProperty("virtualMeterId")) {
          this.selectedPhysicalMeters = [];
          this.newVMeterName = "";
          this.extractVMeters();
        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
   * delete a virtual meter
   * @param id  name of virtual meter, which functions as it's id
   * @param index index of meter in arr, to hotreload page
   */
  deleteVMeterById(id: string, index: number): void {
    this.bwsService.delVirtualMeterById(id).subscribe({
      next: (response) => {
        if (response && response.hasOwnProperty('msg')) {
          alert("Virtual Meter with Name " + id + " not found!");
        } else {
          alert("Virtual Meter with Name: " + id + " deleted!")
          this.vMeters.splice(index, 1);
          this.selectedVirtualMeter = undefined;
        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  // ---------- Algorithm Functions ----------

  /**
   * train one of the Models and retrieve the training data
   */
  trainModel(): void {

    if (!this.selectedVirtualMeter) {
      console.log("No Virtual Meter detected!");
      return;
    }

    if (!this.selectedAlgorithm) {
      console.log("No algorithm detected!");
      return;
    }

    if (!this.modelComment) {
      alert("a comment is necessary!");
      return;
    }

    this.bwsService.putTrainModel(this.selectedVirtualMeter, this.selectedAlgorithm, this.modelComment).subscribe({
      next: (response) => {

        this.extractModels();

        this.toggleSelectedVirtualMeter;
        this.selectedAlgorithm = undefined;
        this.modelComment = '';

        console.log(response);
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
   * delete a model from database using bws service
   * @param vMeterId id of virtual meter the model is trained on
   * @param algId id of algorithm which got used to train model
   * @param index place in list to correctly remove model afterwards
   */
  deleteModel(vMeterId: string, algId: string, index: number): void {

    this.bwsService.delModel(vMeterId, algId).subscribe({
      next: (response) => {
        if (response && response.hasOwnProperty('message')) {
          alert("Model to delete not found");
        } else {
          this.models.splice(index, 1);
          alert("Model deleted!");
        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  // ---------- Forecast Creation -----------

  /**
   * create forecast by receiving data from api and displaying it in a graph
   * @returns if a value for the api request is missing
   */
  getForecast(): void {

    if (!this.selectedModel) {
      alert("No model chosen");
      return;
    }

    let vMeterId = this.selectedModel.refMeter;
    let algId = this.selectedModel.algorithm;

    this.bwsService.getCreateForecast(vMeterId, algId).subscribe({
      next: (response) => {
        if (response.hasOwnProperty('msg')) {
          console.log(response);
        } else {

          let predValues = response.map((item) => item.numValue);

          let date = this.stripDate(response[0].datePredicted);

          this.dataAvailable = true;

          let label = vMeterId + algId + " " + date

          //NOTE: Exchange here
          //this.updateGraphForecast(predValues, date, vMeterId, algId)
          this.updateGraph(predValues, label)

        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  updateGraph(prediction_values: number[], new_label: string): void {

    this.chartData = {
      datasets: [
        { data: prediction_values, label: new_label }
      ]
    }

  }

  // ---------- Utility Functions ----------

  /**
   * strip value for better clarification
   * @param value name of the meter
   * @returns final name string
   */
  stripMeterID(value: string): string {
    if (value.includes('urn:ngsi-ld:Device:')) {
      return value.replace('urn:ngsi-ld:Device:', '')
    }

    if (value.includes('urn:ngsi-ld:virtualMeter:')) {
      return value.replace('urn:ngsi-ld:virtualMeter:', '')
    }

    //BUG: called way too often. -> Table is-hoverable | NOT happening anymore, keep eye on
    console.log("check")

    return 'String not found';
  }

  /**
   * revamps the data format in order to improve readability
   * @param input the old date format
   * @returns the easier to read output
   */
  formatDateTime(input: string): string {
    //BUG: called way too often. -> Table is-hoverable
    //NOTE remember that this can be slow
    const date = new Date(input);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * takes date string as input and transforms it into day.month.year format
   * @param input string to be transformed
   * @returns string in correct format
   */
  stripDate(input: string): string {
    const date = new Date(input);
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();

    return `${day}.${month}.${year}`

  }

  /**
   * calculates the table height dependend on the box height
   * @param input the relative height of the box
   * @param share percentage of the table height
   * @returns the new table height parameter
   */
  calcRelBoxHeight(input: string, share: number): string {
    let x = parseInt(input);
    let y = x * share;
    return y.toString() + "vh";
  }

}
