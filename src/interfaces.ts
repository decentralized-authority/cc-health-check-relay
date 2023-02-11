interface BaseRelayServerRequest {
  method: string
  host: string
  path: string
  port: number
  protocol: string
  timeout: number
}

export interface RelayServerGetRequest extends BaseRelayServerRequest {
  method: 'GET'
}

export interface RelayServerPostRequest extends BaseRelayServerRequest {
  method: 'POST'
  body: string
  type: string
}

export interface RelayServerError {
  statusCode?: number
  message: string
}
export interface RelayServerResponse {
  error: null|RelayServerError
  result: any
  responseTime: number
}
