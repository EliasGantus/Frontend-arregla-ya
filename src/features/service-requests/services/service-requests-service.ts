import { httpClient } from '@/shared/api/http-client';
import type { CreateServiceRequestInput, ServiceRequest } from '@/shared/types/api';

export const serviceRequestsService = {
  list() {
    return httpClient.get<ServiceRequest[]>('/service-requests');
  },
  create(payload: CreateServiceRequestInput) {
    return httpClient.post<ServiceRequest>('/service-requests', payload);
  },
};
