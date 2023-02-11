export interface RelayServerRequest {
  address: string
  method: string
  port: number
  protocol: string
  body: string
  timeout: number
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
