import type { Canceler } from "axios";

export interface PendingRequest {
  cancel: Canceler;
  user?: string;
  params?: any;
  data?: any;
}
