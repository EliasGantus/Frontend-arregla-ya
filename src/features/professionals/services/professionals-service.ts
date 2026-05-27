import { httpClient } from '@/shared/api/http-client';
import type {
  ProfessionalReview,
  ProfessionalSearchFilters,
  ProfessionalSearchResult,
} from '@/shared/types/api';

export const professionalsService = {
  search(filters: ProfessionalSearchFilters = {}) {
    const query = {
      categoryId: filters.categoryId,
      categorySlug: filters.categorySlug,
      zone: filters.zone,
      availableAt: filters.availableAt,
    };

    return httpClient.get<ProfessionalSearchResult[]>('/professionals/search', {
      auth: false,
      query,
    });
  },
  reviews(professionalId: string) {
    return httpClient.get<ProfessionalReview[]>(`/professionals/${professionalId}/reviews`, {
      auth: false,
    });
  },
};
