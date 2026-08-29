import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface CreditCard {
  _id: string;
  name: string;
  issuer: string;
  last4: string;
  creditLimit: number;
  statementClosingDay: number;
  paymentDueDay: number;
  color: string;
  isActive: boolean;
}

export const useCreditCards = () => useQuery({
  queryKey: ['credit-cards'],
  refetchOnMount: 'always',
  queryFn: async () => {
    const response = await api.get<CreditCard[] | { data: CreditCard[] }>('/credit-cards');
    const payload = response.data;
    return Array.isArray(payload) ? payload : payload.data;
  },
});

export const useCreditCardMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
  const create = useMutation({
    mutationFn: async (payload: Omit<CreditCard, '_id' | 'isActive'>) =>
      (await api.post<CreditCard>('/credit-cards', payload)).data,
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CreditCard> & { id: string }) =>
      (await api.patch<CreditCard>(`/credit-cards/${id}`, payload)).data,
    onSuccess: invalidate,
  });
  return { create, update };
};
