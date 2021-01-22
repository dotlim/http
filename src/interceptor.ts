import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { pendingPool, genReqKey, cancelRequestByUser } from './pool';

const CancelToken = axios.CancelToken;

/**
 * HTTP request resolve interceptor
 * @param conf
 */
export function defaultReqResolveInterceptor(conf: AxiosRequestConfig) {
  const user = 'admin@test.com';
  const reservedRequest = {
    user,
    params: conf.params,
    data: conf.data,
  };

  cancelRequestByUser(user);

  // set headers
  conf.headers['USERID'] = user;
  // set cancel token
  conf.cancelToken = new CancelToken((cancel) => {
    const reqKey = genReqKey(conf);

    // cancel previous pending request if exist
    if (pendingPool.has(reqKey)) {
      const existRequest = pendingPool.get(reqKey);
      existRequest.cancel(`Operation canceled due to duplication.`);
    }
    // cache request
    pendingPool.set(reqKey, { ...reservedRequest, cancel });
  });

  return conf;
}

/**
 * HTTP response resolve interceptor
 * @param res
 */
export function defaultResResolveInterceptor(res: AxiosResponse) {
  const data = res.data;
  const errCode = data['error-id']; // 视接口而定

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
export function defaultResRejectInterceptor(err: AxiosError) {
  if (!axios.isCancel(err)) {
    pendingPool.delete(err.config.url);
  }

  return Promise.reject(err);
}
