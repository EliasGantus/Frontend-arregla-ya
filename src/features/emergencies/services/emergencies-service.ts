import { httpClient } from '@/shared/api/http-client';
import type { CreateEmergencyInput, EmergencyResponse } from '@/shared/types/api';

export const emergenciesService = {
  create(payload: CreateEmergencyInput) {
    return httpClient.post<EmergencyResponse>('/emergencies', payload);
  },
};
