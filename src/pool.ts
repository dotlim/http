import { no } from "./utils";
import Http from "./index";
import type { PendingRequest } from "./interface";
import type { AxiosRequestConfig } from "axios";

const REQUEST_PENDING_POOL = "_request_pending_pool_";

export let pendingPool =
  (window as any)[REQUEST_PENDING_POOL] || new Map<string, PendingRequest>(); // pending requests
export let localUser = "";

// export to window
(window as any)[REQUEST_PENDING_POOL] = pendingPool;

/**
 * generate key for request pool
 * @param {AxiosRequestConfig} config
 */
export function genReqKey(config: AxiosRequestConfig): string {
  if (config !== null && typeof config === "object") {
    return `${config.method}+${config.url}`;
  } else {
    return "-";
  }
}

/**
 * cancel request by reqKey
 * @param {string} key
 */
function cancelRequest(key: string) {
  try {
    const request = pendingPool.get(key);

    if (request && request.cancel) {
      request.cancel();
      pendingPool.delete(key);
    } else {
      throw new ReferenceError(
        "The request does not exist or the cancel method does not exist"
      );
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * 获取处于 pending 状态的请求
 */
export function getRequestPendingPool() {
  return Array.from(pendingPool.keys());
}

/**
 * 清空处于 pending 状态的请求
 * @param {Function} assert (request): boolean 返回false能阻止清理
 */
export function clearRequestPendingPool(
  assert: (request: PendingRequest) => boolean = no
) {
  if (pendingPool.size === 0) return;

  const whitelist: string[] = Http.whitelist;

  for (const [key, request] of pendingPool.entries()) {
    if (whitelist.includes(request.url) || assert(request) === true) continue;
    // cancel and remove the pending request
    cancelRequest(key);
  }
}

/**
 * 尝试清理非当前租户发起的请求，并更新本地缓存的用户
 * @param {number|string} tenant 发起请求的用户ID
 */
export function cancelRequestByUser(user: string) {
  if (user !== localUser) {
    clearRequestPendingPool((request) => request.user === user);
  }
  localUser = user;
}
