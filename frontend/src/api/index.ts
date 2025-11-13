import apiClient from './client';
import {
  User,
  Resume,
  Vacancy,
  VacancySearchParams,
  Settings,
  JobApplication,
  Analytics,
} from '../types';

export const api = {
  // Auth
  auth: {
    loginWithHH: () => {
      window.location.href = `${apiClient.defaults.baseURL}/auth/hh`;
    },
    getMe: () => apiClient.get<User>('/auth/me'),
  },

  // Resumes
  resumes: {
    getAll: () => apiClient.get<Resume[]>('/api/resumes'),
    getOne: (id: string) => apiClient.get<Resume>(`/api/resumes/${id}`),
  },

  // Vacancies
  vacancies: {
    search: (params: VacancySearchParams) =>
      apiClient.get<{
        items: Vacancy[];
        found: number;
        pages: number;
        page: number;
      }>('/api/vacancies/search', { params }),
    getOne: (id: string) => apiClient.get<Vacancy>(`/api/vacancies/${id}`),
  },

  // Applications
  applications: {
    create: (data: { vacancyId: string; resumeId: string; message?: string }) =>
      apiClient.post<{ success: boolean; application: JobApplication }>('/api/applications', data),
    getAll: (status?: string) =>
      apiClient.get<JobApplication[]>('/api/applications', {
        params: status ? { status } : {},
      }),
    getOne: (id: string) => apiClient.get<JobApplication>(`/api/applications/${id}`),
  },

  // Settings
  settings: {
    get: () => apiClient.get<Settings>('/api/settings'),
    update: (data: Partial<Settings>) => apiClient.put<Settings>('/api/settings', data),
  },

  // Analytics
  analytics: {
    get: (from?: string, to?: string) =>
      apiClient.get<Analytics>('/api/analytics', {
        params: { from, to },
      }),
    getToday: () =>
      apiClient.get<{
        responsesCount: number;
        viewsCount: number;
        invitationsCount: number;
        rejectionsCount: number;
      }>('/api/analytics/today'),
    getRange: (days: number = 7) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      return apiClient.get<Array<{
        date: string;
        responsesCount: number;
        viewsCount: number;
        invitationsCount: number;
        rejectionsCount: number;
      }>>('/api/analytics/range', {
        params: {
          from: from.toISOString().split('T')[0],
          to: to.toISOString().split('T')[0],
        },
      });
    },
  },
};
