import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCreditCard, getCreditCards, updateCreditCard } from '../services/payment-methodsService';
export type { CreditCard } from '../services/payment-methodsService';

export const useCreditCards = () => useQuery({
  queryKey: ['credit-cards'],
  refetchOnMount: 'always',
  queryFn: getCreditCards,
});

export const useCreditCardMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
  const create = useMutation({
    mutationFn: createCreditCard,
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: updateCreditCard,
    onSuccess: invalidate,
  });
  return { create, update };
};
