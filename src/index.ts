import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosInstance,
  Method,
  AxiosPromise,
  Canceler,
} from "axios";

interface PendingRequest {
  cancel: Canceler;
  flag: number;
}

const CancelToken = axios.CancelToken;
const pending: PendingRequest[] = []; // 正在请求的接口
const removeRepeatRequest = (payload: { user: string }, type?: string) => {
  for (let i = 0; i < pending.length; i++) {
    if (payload.user === "admin@test.com") {
      if (type === "request") {
        pending[i].cancel("Operation canceled by the user.");
      }
      pending.splice(i, 1);
    }
  }
};

/**
 * HTTP request resolve interceptor
 * @param conf
 */
function defaultReqResolveInterceptor(conf: AxiosRequestConfig) {
  // ...
  removeRepeatRequest({ user: "admin@test.com" }, "request");
  conf.cancelToken = new CancelToken((c) => {
    pending.push({ flag: 10, cancel: c });
  });
  return conf;
}

/**
 * HTTP response resolve interceptor
 * @param res
 */
function defaultResResolveInterceptor(res: AxiosResponse) {
  const data = res.data;
  const errCode = data["error-id"]; // 视接口而定

  if (errCode === 0) {
    return data;
  } else {
    // 接口异常
  }

  throw data;
}

/**
 * HTTP response reject interceptor
 * @param err
 */
function defaultResRejectInterceptor(err: AxiosError) {
  if (err) {
    return Promise.reject(err);
  }
}

/**
 * HTTP
 */
class Http {
  urlPrefix: string;
  resInterceptor: (res: AxiosResponse<any>) => any;
  reqInterceptor: (conf: AxiosRequestConfig) => AxiosRequestConfig;
  xhr: AxiosInstance;

  constructor(
    urlPrefix: string,
    resInterceptor = defaultResResolveInterceptor,
    reqInterceptor = defaultReqResolveInterceptor
  ) {
    this.urlPrefix = urlPrefix;
    this.resInterceptor = resInterceptor;
    this.reqInterceptor = reqInterceptor;

    this.xhr = axios.create();
    this.xhr.interceptors.request.use(this.reqInterceptor);
    this.xhr.interceptors.response.use(this.resInterceptor);
    this.xhr.interceptors.response.use(undefined, defaultResRejectInterceptor);
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

  post(url: string, data?: any, prefix?: string) {
    return this.request("POST", url, { data }, prefix); // POST 不再支持自定义 querystring, 可以使用 qs.stringify 自定义，或使用 request 方法
  }

  put(url: string, data?: any, prefix?: string) {
    return this.request("PUT", url, { data }, prefix);
  }

  delete(url: string, params?: any, prefix?: string) {
    return this.request("DELETE", url, { params }, prefix);
  }
}

export default Http;
