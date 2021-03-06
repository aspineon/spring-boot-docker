import { Injectable } from '@angular/core';
import uuid from 'uuid';
import { environment } from '../environments/environment';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/defer';

@Injectable()
export class MessagesService {

  private messages: Message[] = environment.production||environment.messageServiceURLs.length!=0?[]:[
    {
      source: "mongo",
      timestamp : "2017-05-13T15:50:54.502Z",
      message : "Application started: \"Core test application\" at 1494690654500 on orion",
      id : "8c58fa8c-b996-4939-9312-221bda3cbb01"
    }, {
      source: "mongo",
      timestamp : "2017-05-13T15:51:14.199Z",
      message : "Application started: \"Mongo test application\" at 1494690674197 on orion",
      id : "4fc51560-2978-4ea8-81de-3d904c4187da"
    }, {
      source: "mongo",
      timestamp : "2017-05-13T15:58:16.271Z",
      message : "Application started: \"Mongo test application\" at 1494691096269 on orion",
      id : "bb85d2f7-26a2-4131-b104-7a093650a3f9"
    }, {
      source: "mongo",
      timestamp : "2017-05-15T16:49:13.583Z",
      message : "Application started: \"Mariadb test application\" at 1494866953581 on orion",
      id : "41ae3d20-d6db-4e1c-a8ee-eb6899b3a6cb"
    },
    {
      source: "mariadb",
      timestamp : "2017-05-13T15:50:54.502Z",
      message : "Application started: \"Core test application\" at 1494690654500 on orion",
      id : "8c58fa8c-b996-4939-9312-221bda3cbb01"
    }, {
      source: "mariadb",
      timestamp : "2017-05-13T15:51:14.199Z",
      message : "Application started: \"Mongo test application\" at 1494690674197 on orion",
      id : "4fc51560-2978-4ea8-81de-3d904c4187da"
    }, {
      source: "mariadb",
      timestamp : "2017-05-13T15:58:16.271Z",
      message : "Application started: \"Mongo test application\" at 1494691096269 on orion",
      id : "bb85d2f7-26a2-4131-b104-7a093650a3f9"
    }, {
      source: "mariadb",
      timestamp : "2017-05-15T16:49:13.583Z",
      message : "Application started: \"Mariadb test application\" at 1494866953581 on orion",
      id : "41ae3d20-d6db-4e1c-a8ee-eb6899b3a6cb"
    }
  ];

  constructor (private http: Http) {}

  public getMessagesForSource(url: string, source: string): Observable<Message[]> {
    return this.http.get(url)
      .map((response: Response) => {
        let body = response.json();
        console.debug("Got data:", body);
        this.messages = this.messages.filter((value) => value.source!=source);
        this.messages = this.messages.concat((body._embedded.messages || []).map((value) => {
          value.source = source;
          let linkElements = value._links.self.href.split("/");
          value.id = linkElements[linkElements.length-1];
          return value;
        }));
        return this.messages;
      })
      .catch(this.handleError);
  }

  public getMessages(): Observable<Message[]> {
    let retval:Observable<Message[]>;
    if(environment.messageServiceURLs.length===0) {
      retval = Observable.from([this.messages]);
    } else {
      retval = Observable.create(observer => {
        let obs = environment.messageServiceURLs.map((serviceUrl) => this.getMessagesForSource(serviceUrl.url, serviceUrl.source));
        let lastError;
        let completed = obs.map(() => false);
        obs.map((value, index) => value.subscribe(item => {
          observer.next(item);
        }, error => {
          lastError = error;
          completed[index] = true;
          this.handleMessageServiceCompletion(completed, lastError, observer);
        }, () => {
          completed[index] = true;
          this.handleMessageServiceCompletion(completed, lastError, observer);
        }));
      });
    }
    return retval;
  }

  private handleMessageServiceCompletion(completed: boolean[], lastError, observer) {
    if (completed.every(item => item === true)) {
      if (lastError == null) {
        observer.complete();
      } else {
        console.warn("Error getting messages", lastError);
        observer.error(lastError);
      }
    }
  }

  private handleError (error: Response | any) {
    let errMsg: string;
    if (error instanceof Response) {
      errMsg = `${error.status} - ${error.statusText || ''} ${error}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return Observable.throw(errMsg);
  }
}

export class Message {
  public id: uuid;
  public timestamp: string;
  public message: string;
  public source: string;
}
