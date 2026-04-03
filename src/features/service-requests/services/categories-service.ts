import { httpClient } from '@/shared/api/http-client';
import type { CategorySummary } from '@/shared/types/api';

export const categoriesService = {
  list() {
    return httpClient.get<CategorySummary[]>('/categories', { auth: false });
  },
};
