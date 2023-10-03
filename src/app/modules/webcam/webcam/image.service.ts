import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private backendUrl = 'https://backend-service-86r7.onrender.com'; // Replace with your actual backend URL

  constructor(private http: HttpClient) {}

  uploadImage(imageData: any): Observable<any> {
    // Send the image data to the backend for processing
    const formData = new FormData();
    formData.append('image', imageData);
    formData.forEach((value, key) => {
        console.log("xx",key, value);
      })

    // const headers = new HttpHeaders({
    //     'Content-Type': 'multipart/form-data'
    //   });

    //   const requestBody = { image: imageData };
    return this.http.post<any>(
        `${this.backendUrl}/process_image`,
        formData
      ) }
}
