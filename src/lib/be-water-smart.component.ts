import { Component, OnInit } from '@angular/core';
import { BeWaterSmartService } from './be-water-smart.service';
import { PhysicalMeter, VirtualMeter, Algorithm } from './bws-interfaces';

@Component({
  selector: 'lib-be-water-smart',
  templateUrl: "be-water-smart.component.html",
  styles: [
  ]
})
export class BeWaterSmartComponent implements OnInit {

  // list of physical meter | jsonobjects
  pMeters: PhysicalMeter[] = [];

  // temporary list of PhysicalMeters to add them to a VirtualMeter
  selectedPhysicalMeters: PhysicalMeter[] = [];

  // name for the new virtual meter
  newVMeterName: string = "";

  // list of virtual meter | jsonobjects
  vMeters: VirtualMeter[] = [];

  // string to filter name of smartMeters
  physicalMeterString: string = 'urn:ngsi-ld:Device:';

  // string to filter name of virtualMeters
  virtualMeterString: string = 'urn:ngsi-ld:virtualMeter:';

  algorithms: Algorithm[] = [];

  // max number of characters per column
  slice: number = 20;

  constructor(public bwsService: BeWaterSmartService) { }

  ngOnInit(): void {
    this.extractPMeters();
    this.extractVMeters();
    this.extractAlgorithms();
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
          alert("Virtual Meter created");

          this.selectedPhysicalMeters = [];
          this.newVMeterName = "";
          this.extractVMeters();
        }
      },
      error: (error) => {
        console.log(error);
        alert("Something went wrong!");
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
        }
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
  toggleSelectedMeter(item: PhysicalMeter, event: Event) {

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
   * Remove the leading ID to shorten the website representation
   * @param value the string to be transformed
   * @returns a representation of the string without the leading ID
   */
  stripSmartMeterID(value: string): string {
    return value.replace(this.physicalMeterString, '');
  }

  /**
   Remove the leading ID to shorten the website representation
   * @param value the string to be transformed
   * @returns a representation of the string without the leading ID
   */
  stripVirtualMeterID(value: string): string {
    return value.replace(this.virtualMeterString, '');
  }

  /**
   * revamps the data format in order to improve readability
   * @param input the old date format
   * @returns the easier to read output
   */
  formatDateTime(input: string): string {
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





}
