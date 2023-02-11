# Community Chains Health Check Relay
Server to relay health check requests to RPC nodes within a closed network.

## Build and run from source

### Install dependencies
```
npm install
```

### Run tests
```
npm test
```

### Build
```
npm run build
```

### Start relay server
```
npm start
```

## Run via Docker
```
docker run -p 3100:3100/tcp decentralizedauthority/cc-health-check-relay:x.x.x
```

## Usage
The server is designed to relay `GET` or `POST` requests.

### `GET` request relay body
```ts
interface RelayServerGetRequest {
  method: 'GET'
  host: string
  path: string
  port: number
  protocol: string
  timeout: number
}
```

### `POST` request relay body
```ts
interface RelayServerPostRequest {
  method: 'POST'
  host: string
  path: string
  port: number
  protocol: string
  timeout: number
  body: string
  type: string
}
```

### Relay response
```ts
interface RelayServerError {
  statusCode?: number
  message: string
}
interface RelayServerResponse {
  error: null|RelayServerError
  result: any                    // response body from relayed RPC request
  responseTime: number           // time in ms to complete request
}
```

### Example Relay Request using [Superagent](https://www.npmjs.com/package/superagent) library
```ts
import request from 'superagent';

const rpcRequestBody = {
  jsonrpc: '2.0',
  id: 1,
  method: 'eth_blockNumber',
  params: [],
};

const relayRequest = {
  host: '10.0.0.1',
  path: '/',
  port: 8545,
  method: 'POST',
  protocol: 'http',
  body: JSON.stringify(rpcRequestBody),
  type: 'application/json',
  timeout: 10000,
};

request
  .post('http://localhost:3100/relay')
  .type('application/json')
  .send(relayRequest)
  .timeout(10000)
  .then((res) => {
    const { error, result, responseTime } = res.body;
    console.log(`Request completed in ${responseTime}ms`);
    if(error) { // handle relay error
      const { statusCode, message } = error;
      console.error(`Error: "${message}" Status Code: ${statusCode || 'none'}`);
    } else { // handle relay result
      console.log(result);
    }
  })
  .catch((err) => {
    // handle error
  });
```

## License
Apache License Version 2.0
