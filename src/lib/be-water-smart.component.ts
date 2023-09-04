import { Component, OnInit } from '@angular/core';
import { BeWaterSmartService } from './be-water-smart.service';
import { PhysicalMeter, VirtualMeter, Algorithm, MLModel } from './bws-interfaces';

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

  constructor(public bwsService: BeWaterSmartService) { }

  ngOnInit(): void {
    this.extractPMeters();
    this.extractVMeters();
    this.extractAlgorithms();
    this.extractModels();
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
    console.log(this.selectedAlgorithm.name);
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
      console.log("a comment is necessary!");
      alert("a comment is necessary!");
      return;
    }

    this.bwsService.putTrainModel(this.selectedVirtualMeter, this.selectedAlgorithm, this.modelComment).subscribe({
      next: (response) => {
        this.selectedVirtualMeter = undefined;
        this.selectedAlgorithm = undefined;
        this.extractModels();
        console.log(response);
        this.modelComment = '';

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
        console.log(response);
      },
      error: (error) => {
        console.log(error);
      },
    })
  }


  deleteModel(vMeterId: string, algId: string, index: number): void {

    console.log(vMeterId);
    console.log(algId);
    console.log(index);




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
