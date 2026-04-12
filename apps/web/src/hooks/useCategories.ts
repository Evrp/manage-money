import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories');
      return data;
    },
  });
};
