import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export interface BankAccount {
  _id: string;
  name: string;
  bankName: string;
  last4?: string;
  color?: string;
}

export const useBankAccounts = () =>
  useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data } = await api.get<BankAccount[] | { data: BankAccount[] }>("/bank-accounts");
      return Array.isArray(data) ? data : data.data || [];
    },
  });

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Pick<BankAccount, "name" | "bankName" | "last4">) =>
      (await api.post<BankAccount>("/bank-accounts", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
};
