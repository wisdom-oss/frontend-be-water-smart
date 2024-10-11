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

  // ---------- StringFormatting ----------


  /**
   * array of prefixes to remove from id-strings of smart meters
   */
  prefixes: string[] = ["urn:ngsi-ld:virtualMeter:", "urn:ngsi-ld:Device:"]

  // ---------- Layout Parameters ----------

  /**
   * max number of characters per column
   */
  slice: number = 20;

  /**
   * height of model selection box
   */
  heightModel: string = "50vh";

  /**
   * height of training algorithm box
   */
  heightAlg: string = "25vh";

  /**
   * box height virtual meter display, 
   * table height in relation
   */
  heightVM: string = "50vh";
  heightVMTable: string = this.calcRelBoxHeight(this.heightVM, 0.65); //0.65

  /**
   * box height physical meter display, 
   * table height in relation
   */
  heightPM: string = "50vh";
  heightPMTable: string = this.calcRelBoxHeight(this.heightPM, 0.65); // 0.65


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
    responsive: true,
    scales: {
      y: {
        stacked: true,
        title: {
          display: true,
          text: "m^3"
        }
      },
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Time"
        }
      }
    },
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
   * a list of selectedVirtualMeters to create a Super Meter
   */
  selectedVirtualMeters: VirtualMeter[] = [];

  /**
   * selected virtual meter to train a model
   */
  selectedVirtualMeter: VirtualMeter | undefined;

  /**
   * name of potential new virtual meter
   */
  newVMeterName: string | undefined;

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

  /**
   * flags if a delete operation is in progress
   * @param isDeleting: boolean flag 
   */
  isDeleting: boolean = false;

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

  toggleSelectedMeter(item: any, event: Event, selectedMeters: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      selectedMeters.push(item)
    } else {
      const index = selectedMeters.findIndex((meter: { id: any; }) => meter.id === item.id)
      if (index > -1) {
        selectedMeters.splice(index, 1); // Remove the item if unchecked
      }
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

  // ---------- VirtualMeterList Functions ----------

  /**
   * creates a new VMeter with an @input name and the id-list of the selected physical meters.
   * If successful, user gets informed and all global variables get set back.
   * If failed, user gets informed
   */
  addVMeter(selectedMeters: any): void {

    if (!this.newVMeterName) {
      alert("No Name for Virtual Meter!");
      return;
    }

    this.bwsService.addVirtualMeterWithId(this.newVMeterName, this.createSubMeterList(selectedMeters)).subscribe({
      next: (response) => {
        if (response.hasOwnProperty("virtualMeterId")) {
          this.selectedPhysicalMeters = [];
          this.selectedVirtualMeters = [];
          this.newVMeterName = undefined;
          this.extractVMeters();
        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
   * help function for addVMeter()
   * @returns a list of all ids which are inside the virtual meter
   */
  createSubMeterList(selectedMeters: any): Object {

    let id_list: string[] = [];

    selectedMeters.forEach((item: { id: string; }) => {
      id_list.push(item.id);
    });

    return { submeterIds: id_list }
  }

  /**
   * delete a virtual meter
   * @param id  name of virtual meter, which functions as it's id
   * @param index index of meter in arr, to hotreload page
   */
  deleteVMeterById(id: string, index: number): void {
    if (this.isDeleting) {
      return;
    }

    // flag true aslong as deletion is processed)
    this.isDeleting = true;

    let tmp = this.vMeters.splice(index, 1);

    console.log(tmp);

    this.bwsService.delVirtualMeterById(id).subscribe({
      next: (response) => {
        if (response && response.hasOwnProperty('msg')) {
          this.vMeters.push(tmp[0]);
          alert("Virtual Meter with Name " + id + " not found and can not be deleted!");
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.isDeleting = false;
      }
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
        this.selectedAlgorithm = undefined;
        this.selectedVirtualMeter = undefined;
        this.modelComment = undefined;
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

          let date = response[0].datePredicted;

          let label = vMeterId + algId + " " + date

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
