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
  user: string;
}

const CancelToken = axios.CancelToken;
const pendingPool = new Map<string | undefined, PendingRequest>(); // pending requests

/**
 * HTTP request resolve interceptor
 * @param conf
 */
function defaultReqResolveInterceptor(conf: AxiosRequestConfig) {
  // ...
  conf.cancelToken = new CancelToken((cancel) => {
    if (pendingPool.has(conf.url)) {
      cancel(`Operation canceled due to duplication.`);
    } else {
      pendingPool.set(conf.url, { cancel, user: "admin@test.com" });
    }
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

  pendingPool.delete(res.config.url);

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
  if (!axios.isCancel(err)) {
    pendingPool.delete(err.config.url);
  }

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

  getPendingRequest() {
    return Array.from(pendingPool.keys());
  }

  clearPendingPool(whileList: string[] = []) {
    if (pendingPool.size === 0) return;

    for (let [url = "", request] of pendingPool.entries()) {
      if (whileList.includes(url)) continue;
      pendingPool.get(url)?.cancel();
      pendingPool.delete(url);
    }
  }
}

export default Http;
