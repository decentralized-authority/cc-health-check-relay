// @ts-ignore
import should from 'should';
// @ts-ignore
import express from 'express';
import { RelayServer } from './relay-server';
import tcpPortUsed from 'tcp-port-used';
import * as http from 'http';
import * as bodyParser from 'body-parser';

describe('RelayServer', function() {

  this.timeout(10000);

  let port = 3099;
  const version = '1.1.1';

  before(async function() {
    let portUsed = true;
    while(portUsed) {
      port++;
      portUsed = await tcpPortUsed.check(port);
    }
  });

  describe('.getVersion()', function() {
    it('should return the version', function() {
      const relayServer = new RelayServer(3100, version);
      relayServer.getVersion().should.equal(version);
    });
  });

  describe('.postRelayRequest()', function() {

    let server: http.Server;
    const getResponse = 'get response';
    const postResponse = {
      response: 'post response',
    };
    let postRequestBody: any;
    const timeout = 1000;
    const timeoutPath = '/timeout';

    before(async function() {
      await new Promise<void>((resolve) => {
        server = express()
          .use(bodyParser.json())
          .get('/', (req, res) => {
            res.send(getResponse); // text response
          })
          .post('/', (req, res) => {
            postRequestBody = req.body;
            res.type('application/json');
            res.send(JSON.stringify(postResponse)); // json response
          })
          .post(timeoutPath, (req, res) => {
            setTimeout(() => {
              res.type('application/json');
              res.send(JSON.stringify({}))
            }, timeout + 100);
          })
          .listen(port, () => {
            resolve();
          });
      });
    });

    it('should relay a request', async function() {

      const relayServer = new RelayServer(port, version);

      { // Invalid request error
        const res = await relayServer.postRelayRequest({
          host: 'localhost',
          path: '/',
          port: 999999999999, // invalid port
          method: 'GET',
          protocol: 'http',
          timeout,
        });
        should(res.result).be.Null();
        res.error.should.be.an.Object();
        should(res.error.statusCode).be.Undefined();
        res.error.message.should.be.a.String();
        res.responseTime.should.be.greaterThan(0);
      }
      { // HTTP error
        const res = await relayServer.postRelayRequest({
          host: 'localhost',
          path: '/',
          port,
          // @ts-ignore
          method: 'PUT', // invalid method
          protocol: 'http',
          body: JSON.stringify({}),
          type: 'application/json',
          timeout,
        });
        should(res.result).be.Null();
        res.error.should.be.an.Object();
        res.error.statusCode.should.be.a.Number();
        res.error.message.should.be.a.String();
        res.responseTime.should.be.greaterThan(0);
      }
      { // Timeout error
        const res = await relayServer.postRelayRequest({
          host: 'localhost',
          path: timeoutPath,
          port,
          method: 'POST',
          protocol: 'http',
          body: JSON.stringify({}),
          type: 'application/json',
          timeout,
        });
        should(res.result).be.Null();
        res.error.should.be.an.Object();
        should(res.error.statusCode).be.Undefined();
        res.error.message.should.be.a.String();
        res.responseTime.should.be.greaterThan(timeout);
      }
      { // GET Request
        const res = await relayServer.postRelayRequest({
          host: 'localhost',
          path: '/',
          port,
          method: 'GET',
          protocol: 'http',
          timeout,
        });
        should(res.error).be.Null();
        res.result.should.deepEqual(getResponse);
        res.responseTime.should.be.greaterThan(0);
      }
      { // POST Request
        const requestBody = {
          jsonrpc: '2.0',
          id: 1,
          method: 'something',
          params: [],
        };
        const res = await relayServer.postRelayRequest({
          host: 'localhost',
          path: '/',
          port,
          method: 'POST',
          protocol: 'http',
          body: JSON.stringify(requestBody),
          type: 'application/json',
          timeout,
        });
        postRequestBody.should.deepEqual(requestBody);
        should(res.error).be.Null();
        res.result.should.deepEqual(postResponse);
        res.responseTime.should.be.greaterThan(0);
      }
    });

    after(async function() {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    })

  });

});
