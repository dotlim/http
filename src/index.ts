import axios from "axios";
import {
  defaultReqResolveInterceptor,
  defaultResRejectInterceptor,
  defaultResResolveInterceptor,
} from "./interceptor";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosInstance,
  Method,
  AxiosPromise,
} from "axios";

/**
 * HTTP
 */
class Http {
  urlPrefix: string;
  resInterceptor: (res: AxiosResponse<any>) => any;
  reqInterceptor: (conf: AxiosRequestConfig) => AxiosRequestConfig;
  xhr: AxiosInstance;
  static whitelist: string[];

  constructor(
    urlPrefix: string,
    resInterceptor = defaultResResolveInterceptor,
    reqInterceptor = defaultReqResolveInterceptor,
    whitelist: string[]
  ) {
    this.urlPrefix = urlPrefix;
    this.resInterceptor = resInterceptor;
    this.reqInterceptor = reqInterceptor;

    this.xhr = axios.create();
    this.xhr.interceptors.request.use(this.reqInterceptor);
    this.xhr.interceptors.response.use(this.resInterceptor);
    this.xhr.interceptors.response.use(undefined, defaultResRejectInterceptor);

    Http.whitelist = whitelist;
  }

  request(
    method: Method,
    url: string,
    options: any,
    prefix: string = ""
  ): AxiosPromise {
    if (typeof options !== null && typeof options === "object") {
      Object.assign(options, { method });
    }
    return this.xhr(prefix + url, options);
  }

  get(url: string, params?: any, prefix?: string) {
    return this.request("GET", url, { params }, prefix);
  }

  post(url: string, data?: any, params?: any, prefix?: string) {
    return this.request("POST", url, { data, params }, prefix);
  }

  put(url: string, data?: any, params?: any, prefix?: string) {
    return this.request("PUT", url, { data, params }, prefix);
  }

  patch(url: string, data?: any, params?: any, prefix?: string) {
    return this.request("PATCH", url, { data, params }, prefix);
  }

  delete(url: string, params?: any, prefix?: string) {
    return this.request("DELETE", url, { params }, prefix);
  }
}

Http.whitelist = [];

export default Http;
