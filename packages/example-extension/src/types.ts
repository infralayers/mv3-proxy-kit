export interface ProxyCredentials {
  username: string;
  password: string;
}

export interface ProxyConfigState {
  host: string;
  port: number;
  pacUrl?: string;
}

export interface EnableProxyPayload extends ProxyCredentials {
  host: string;
  port: number;
  pacUrl?: string;
}

export interface DisableProxyPayload {}

export interface GetProxyStatePayload {}

export interface GetProxyStateResponse {
  host: string;
  port: string; // use string because HTML input values are strings
  pacUrl: string;
  username: string;
  password: string;
}