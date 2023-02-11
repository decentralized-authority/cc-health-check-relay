import express from 'express';
import bodyParser from 'body-parser';
import request from 'superagent';
import { RelayServerRequest, RelayServerResponse } from './interfaces';

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
            res.send(JSON.stringify(this._version));
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

  async postRelayRequest(relayServerRequest: RelayServerRequest): Promise<RelayServerResponse> {
    const start = Date.now();
    try {
      const { address, method, port, protocol, body, timeout } = relayServerRequest;
      const response = await this._request(method, `${protocol}://${address}:${port}`)
        .send(body)
        .timeout(timeout);
      const end = Date.now();
      return {
        error: null,
        result: response.body,
        responseTime: end - start,
      };
    } catch(err: any) {
      const end = Date.now();
      return {
        error: {
          statusCode: err.status,
          message: err.message,
        },
        result: null,
        responseTime: end - start,
      };
    }
  }

}
