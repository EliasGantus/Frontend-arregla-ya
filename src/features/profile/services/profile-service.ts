import { httpClient } from '@/shared/api/http-client';
import type { AuthUser, UpdateProfileInput } from '@/shared/types/api';

export const profileService = {
  me() {
    return httpClient.get<AuthUser>('/me');
  },
  update(data: UpdateProfileInput) {
    return httpClient.patch<AuthUser>('/me', data);
  },
};
