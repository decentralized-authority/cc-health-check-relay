import express from 'express';
import bodyParser from 'body-parser';
import request from 'superagent';
import { RelayServerError, RelayServerGetRequest, RelayServerPostRequest, RelayServerResponse } from './interfaces';
import isPlainObject from 'lodash/isPlainObject';

export class RelayServer {

  static Routes = {
    VERSION: '/version',
    RELAY: '/relay',
  }

  _port: number;
  _version: string;
  _request = request;

  constructor(port: number, version: string) {
    this._port = port;
    this._version = version;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        express()
          .use(bodyParser.json())
          .use(bodyParser.text())
          .get(RelayServer.Routes.VERSION, (req, res) => {
            res.status(200)
            res.type('application/json');
            res.send(JSON.stringify(this.getVersion()));
          })
          .post(RelayServer.Routes.RELAY, async (req, res) => {
            res.status(200);
            res.type('application/json');
            const result = await this.postRelayRequest(req.body);
            res.send(JSON.stringify(result));
          })
          .listen(this._port, () => {
            console.log(`CC Health Check Relay listening on port ${this._port}`);
            resolve();
          })
          .on('error', (err: any) => {
            reject(err);
          });
      } catch(err) {
        reject(err);
      }
    });
  }

  getVersion(): string {
    return this._version;
  }

  async postRelayRequest(relayServerRequest: RelayServerGetRequest|RelayServerPostRequest): Promise<RelayServerResponse> {
    const start = Date.now();
    try {
      let response: request.Response;
      const { host, path, method, port, protocol, timeout } = relayServerRequest;
      const url = `${protocol}://${host}:${port}${path}`;
      if(relayServerRequest.method === 'GET') {
        response = await this._request(method, url)
          .timeout(timeout);
      } else {
        const { body, type } = relayServerRequest;
        response = await this._request(method, url)
          .type(type)
          .send(body)
          .timeout(timeout);
      }
      const end = Date.now();
      const result = isPlainObject(response.body) && Object.keys(response.body).length === 0 ? response.text : response.body;
      return {
        error: null,
        result,
        responseTime: end - start,
      };
    } catch(err: any) {
      const end = Date.now();
      const errorObj: RelayServerError = {
        message: err.message,
      };
      if(err.status)
        errorObj.statusCode = err.status;
      return {
        error: errorObj,
        result: null,
        responseTime: end - start,
      };
    }
  }

}
