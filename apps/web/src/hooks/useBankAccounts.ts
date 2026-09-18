import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBankAccount, getBankAccounts } from "../services/payment-methodsService";
export type { BankAccount } from "../services/payment-methodsService";

export const useBankAccounts = () =>
  useQuery({
    queryKey: ["bank-accounts"],
    queryFn: getBankAccounts,
  });

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBankAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
};
