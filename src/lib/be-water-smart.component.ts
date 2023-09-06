import { Component, OnInit } from '@angular/core';
import { BeWaterSmartService } from './be-water-smart.service';
import { PhysicalMeter, VirtualMeter, Algorithm, MLModel } from './bws-interfaces';
import Chart from 'chart.js/auto';

@Component({
  selector: 'lib-be-water-smart',
  templateUrl: "be-water-smart.component.html",
  styleUrls: ['be-water-smart.css'
  ]
})
export class BeWaterSmartComponent implements OnInit {

  // ---------- Layout Parameters ----------

  // max number of characters per column
  slice: number = 20;

  // box height of physical meters
  heightPM: string = "30vh";
  heightPMTable: string = this.calcRelBoxHeight(this.heightPM, 0.5);

  // box height of virtual meters
  heightVM: string = "60vh";
  heightVMTable: string = this.calcRelBoxHeight(this.heightVM, 0.55);

  heightAlg: string = "65vh";
  heightAlgTable: string = this.calcRelBoxHeight(this.heightAlg, 0.7);

  heightModel: string = "30vh";
  heightModelTable: string = this.calcRelBoxHeight(this.heightModel, 0.7);

  heightForecast: string = "90vh";
  heightForecastGraph: string = this.calcRelBoxHeight(this.heightModel, 0.8);



  // ---------- Physical Meter Parameters ----------

  // list of physical meter | jsonobjects
  pMeters: PhysicalMeter[] = [];

  // temporary list of PhysicalMeters to add them to a VirtualMeter
  selectedPhysicalMeters: PhysicalMeter[] = [];

  // ---------- Virtual Meter Parameters ----------

  // list of virtual meter | jsonobjects
  vMeters: VirtualMeter[] = [];

  selectedVirtualMeters: VirtualMeter[] = [];

  selectedVirtualMeter: VirtualMeter | undefined;

  // name for the new virtual meter
  newVMeterName: string = "";

  // ---------- Algorithm Parameters ----------

  algorithms: Algorithm[] = [];

  selectedAlgorithm: Algorithm | undefined;

  models: MLModel[] = [];

  selectedModel: MLModel | undefined;

  modelComment: string | undefined;

  // ---------- Forecast Parameters ----------

  chart: any; // Chart.js chart instance

  dataAvailable: boolean = false;

  constructor(public bwsService: BeWaterSmartService) { }

  ngOnInit(): void {
    this.extractPMeters();
    this.extractVMeters();
    this.extractAlgorithms();
    this.extractModels();
    this.createForecastGraph();
  }

  // ---------- SmartMeterList Functions ----------

  /**
   * extract  physical meters from  database
   */
  extractPMeters(): void {
    this.bwsService.getPhysicalMeters().subscribe({
      next: (response) => {
        // extracts the meters content immediately, 
        // so you dont have to do it all the time
        this.pMeters = response.meters;
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
 * Check if a physicalMeter is selected for creation of a virtual meter
 * @param item the physicalMeter to be checked
 * @param event the event from checkbox
 */
  toggleSelectedPhysicalMeter(item: PhysicalMeter, event: Event) {

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

  // ---------- VirtualMeterList Functions ----------

  /**
   * extract  virtual meters from database
   */
  extractVMeters(): void {
    this.bwsService.getVirtualMeters().subscribe({
      next: (response) => {
        // extracts the meters content immediately, 
        // so you dont have to do it all the time
        this.vMeters = response.virtualMeters;
      },
      error: (error) => {
        console.log(error);
      },
    })
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
        if (response.hasOwnProperty('msg')) {
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

  extractAlgorithms(): void {
    this.bwsService.getAlgorithms().subscribe({
      next: (response) => {
        // extracts the meters content immediately, 
        // so you dont have to do it all the time
        this.algorithms = response.algorithms;
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  chooseAlgorithm(input: Algorithm): void {
    this.selectedAlgorithm = input;
  }

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
   * get all trained Models back
   */
  extractModels(): void {
    this.bwsService.getModels().subscribe({
      next: (response) => {
        this.models = response.MLModels;
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  toggleSelectedModel(item: any) {
    if (this.selectedModel === item) {
      this.selectedModel = undefined; // Untick the selected item
    } else {
      this.selectedModel = item; // Tick the selected item
    }
  }


  deleteModel(vMeterId: string, algId: string, index: number): void {

    this.bwsService.delModel(vMeterId, algId).subscribe({
      next: (response) => {
        if (response.hasOwnProperty('message')) {
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

          let timestamps = this.formatDateTimeGraph(response.map((item) => item.datePredicted));
          let predValues = response.map((item) => item.numValue);

          let date = this.stripDate(response[0].datePredicted);

          this.dataAvailable = true;

          this.createForecastGraph(timestamps, predValues, date);

          //this.toggleSelectedVirtualMeter;
          this.toggleSelectedModel;

        }
      },
      error: (error) => {
        console.log(error);
      },
    })
  }

  /**
   * creates a graph from api
   * @param xAxis timestamps out of json body
   * @param yAxis predicted values out of json body
   * @param date of the day displayed
   */
  createForecastGraph(xAxis?: string[], yAxis?: number[], date?: string): void {

    if (this.chart) {
      this.chart.destroy();
    }

    let standardTimes: string[] = ['01:00:00', '02:00:00', '03:00:00',
      '04:00:00', '05:00:00', '06:00:00', '07:00:00',
      '08:00:00', '09:00:00', '10:00:00', '11:00:00',
      '12:00:00', '13:00:00', '14:00:00', '15:00:00',
      '16:00:00', '17:00:00', '18:00:00', '19:00:00',
      '20:00:00', '21:00:00', '22:00:00', '23:00:00']

    const ctx = document.getElementById('lineChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.dataAvailable ? xAxis : standardTimes,
        datasets: [
          {
            label: date,
            data: this.dataAvailable ? yAxis : [],
            borderColor: 'blue',
            backgroundColor: 'rgba(0,0,255,0.2)',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            title: {
              display: true,
              text: 'm^3'
            }
          },
          x: {
            title: {
              display: true,
              text: 'time'
            }
          }
        }
      },
    });
  }




  // ---------- Utility Functions ----------

  // get the debug message -> check if api is reachable
  getDebugMessage(): void {
    let a = this.bwsService.getDebugMessage();
    a.subscribe({
      next: (response) => {
        console.log(response);
      },
      error: (response) => {
        console.error(response);
      }
    })

  }

  /**
   * strip value for better clarification
   * @param value name of the meter
   * @returns final name string
   */
  stripMeterID(value: string): string {
    //BUG: called way too often. -> Table is-hoverable
    if (value.includes('urn:ngsi-ld:Device:')) {
      return value.replace('urn:ngsi-ld:Device:', '')
    }

    if (value.includes('urn:ngsi-ld:virtualMeter:')) {
      return value.replace('urn:ngsi-ld:virtualMeter:', '')
    }

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
   * format the array to only contain timestamps and no datetime
   * @param input string array with the contained datetime
   * @returns string array without the date
   */
  formatDateTimeGraph(input: string[]): string[] {

    let newTimes: string[] = [];

    input.forEach(item => {
      const date = new Date(item);
      const hours = ('0' + date.getHours()).slice(-2);
      const minutes = ('0' + date.getMinutes()).slice(-2);
      const seconds = ('0' + date.getSeconds()).slice(-2);

      let finalTime = `${hours}:${minutes}:${seconds}`;

      newTimes.push(finalTime);
    });

    return newTimes
  }

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
