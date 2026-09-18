import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/categoriesService';
export type { Category } from '../services/categoriesService';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
};
