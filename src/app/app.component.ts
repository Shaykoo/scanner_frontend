import {Component, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {WebcamImage} from './modules/webcam/domain/webcam-image';
import {WebcamUtil} from './modules/webcam/util/webcam.util';
import {WebcamInitError} from './modules/webcam/domain/webcam-init-error';
import { ImageService } from './modules/webcam/webcam/image.service';

@Component({
  selector: 'appRoot',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // toggle webcam on/off
  public showWebcam = true;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public facingMode: string = 'environment';
  public messages: any[] = [];
  public barcodeData: string[] = [];

  // latest snapshot
  public webcamImage: WebcamImage = null;

  public processedImageUrl: string | null = null;
  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean|string> = new Subject<boolean|string>();
  


  constructor(private imageService: ImageService) {}

  public ngOnInit(): void {
    this.readAvailableVideoInputs();
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.messages.push(error);
    if (error.mediaStreamError && error.mediaStreamError.name === 'NotAllowedError') {
      this.addMessage('User denied camera access');
    }
  }

  public showNextWebcam(directionOrDeviceId: boolean|string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.addMessage('Received webcam image');
    console.log(webcamImage);
  
    // Convert the webcam image data to a suitable format (e.g., Base64)
    const imageData = webcamImage.imageAsDataUrl;
    console.log("imageData", imageData); // Log the imageData for debugging
  
    // Check if imageData is a valid Data URI
    if (imageData && imageData.startsWith('data:')) {
      // Convert the Base64 data to a Blob
      const blob = this.dataURItoBlob(imageData);
      // Create a File object from the Blob (you can provide a file name)
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      
      // Send the image data to the backend
      this.imageService.uploadImage(file).subscribe((response) => {
        // Handle the response from the backend (e.g., display the processed image)
        console.log('Backend response:', response);
  
        // Assuming the backend sends the processed image URL in the response
        if (response.processedImage) {
          // Create a Data URL from the base64 image data
          const processedImageDataUrl = 'data:image/jpeg;base64,' + response.processedImage;
          // Set the processed image URL to display in your HTML
          this.processedImageUrl = processedImageDataUrl;
          console.log("processed", this.processedImageUrl)
        }
        console.log("ress", response.barcodeData)
        // Handle barcode data (assuming barcodeData is an array)
        if (response.barcodeData && response.barcodeData.length > 0) {
          // Assign barcode data to the component property
          this.barcodeData = response.barcodeData;
        }
      });
    } else {
      console.error('Invalid imageData:', imageData);
      // Handle the error as needed in your code
    }
  }
  

  public cameraWasSwitched(deviceId: string): void {
    this.addMessage('Active device: ' + deviceId);
    this.deviceId = deviceId;
    this.readAvailableVideoInputs();
  }

  addMessage(message: any): void {
    console.log(message);
    this.messages.unshift(message);
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean|string> {
    return this.nextWebcam.asObservable();
  }

  public get videoOptions(): MediaTrackConstraints {
    const result: MediaTrackConstraints = {};
    if (this.facingMode && this.facingMode !== '') {
      result.facingMode = { ideal: this.facingMode };
    }

    return result;
  }

  private readAvailableVideoInputs() {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });
  }

  private dataURItoBlob(dataURI: string): Blob {
    try {
      const parts = dataURI.split(',');
      if (parts.length !== 2) {
        throw new Error('Invalid Data URI format');
      }
  
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
  
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
  
      return new Blob([arrayBuffer], { type: mimeString });
    } catch (error) {
      console.error('Error converting Data URI to Blob:', error);
      return null; // Handle the error as needed in your code
    }
  }
}
