import { httpClient } from '@/shared/api/http-client';
import type { CreateReviewInput, ProfessionalReview } from '@/shared/types/api';

export const reviewsService = {
  create(payload: CreateReviewInput) {
    return httpClient.post<ProfessionalReview>('/reviews', payload);
  },
};
