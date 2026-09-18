import api from "./api";
export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

export interface CreateCategoryPayload {
  name: string;
  icon?: string;
  color?: string;
  type: Category["type"];
}

export const getCategories = async () => (await api.get<Category[]>("/categories")).data;
export const createCategory = async (payload: CreateCategoryPayload) =>
  (await api.post("/categories", payload)).data;
