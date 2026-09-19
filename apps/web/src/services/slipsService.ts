import api from "./api";

export interface PendingSlipViewParams {
  fromDate?: string;
  toDate?: string;
  sort: "newest" | "oldest";
}

export interface PendingSlipView {
  ids: string[];
  total: number;
}

export interface ConfirmSlipParams {
  slipId: string;
  transactionData: unknown;
}

export interface ConfirmSlipsParams {
  items: unknown[];
}

export interface SetPendingSlipReadyParams {
  id: string;
  readyForSave: boolean;
}

export const getPendingSlips = async () => (await api.get("/slips/pending")).data;
export const getPendingSlipView = async (params: PendingSlipViewParams) =>
  (await api.get<PendingSlipView>("/slips/pending/view", { params })).data;
export const uploadSlip = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return (await api.post("/slips/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const uploadSlipAttachment = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return (await api.post("/slips/attachment", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const deletePendingSlip = (id: string) => api.delete(`/slips/${id}`);
export const setPendingSlipReady = ({ id, readyForSave }: SetPendingSlipReadyParams) =>
  api.patch(`/slips/${id}/ready`, { readyForSave });
export const confirmSlip = ({ slipId, transactionData }: ConfirmSlipParams) => api.post("/slips/confirm", { slipId, transactionData });
export const confirmSlips = ({ items }: ConfirmSlipsParams) => api.post("/slips/batch-confirm", { items });
