import { httpClient } from '@/shared/api/http-client';
import type { AdminUserSummary, ServiceRequest } from '@/shared/types/api';

export const adminService = {
  users() {
    return httpClient.get<AdminUserSummary[]>('/admin/users');
  },
  serviceRequests() {
    return httpClient.get<ServiceRequest[]>('/admin/service-requests');
  },
};
