import api from "./api";

export interface LineAuthenticationPayload {
  idToken: string;
}

export const authenticateDevelopment = () => api.post("/auth/development");
export const authenticateWithLine = ({ idToken }: LineAuthenticationPayload) =>
  api.post("/auth/line", { idToken });
