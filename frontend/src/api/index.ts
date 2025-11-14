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
    markAsViewed: (id: string) => apiClient.post(`/api/vacancies/${id}/view`),
    getHistory: (limit = 50, offset = 0) =>
      apiClient.get<Array<{ id: string; viewedAt: string; job: any }>>('/api/vacancies/history/list', {
        params: { limit, offset },
      }),
    addToFavorites: (id: string) => apiClient.post(`/api/vacancies/${id}/favorite`),
    removeFromFavorites: (id: string) => apiClient.delete(`/api/vacancies/${id}/favorite`),
    getFavorites: () =>
      apiClient.get<Array<{ id: string; addedAt: string; job: any }>>('/api/vacancies/favorites/list'),
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
    exportCSV: () => {
      const token = localStorage.getItem('token');
      window.open(`${apiClient.defaults.baseURL}/api/applications/export/csv?token=${token}`, '_blank');
    },
    exportJSON: () => {
      const token = localStorage.getItem('token');
      window.open(`${apiClient.defaults.baseURL}/api/applications/export/json?token=${token}`, '_blank');
    },
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
    exportCSV: (from?: string, to?: string) => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ token: token || '' });
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      window.open(`${apiClient.defaults.baseURL}/api/analytics/export/csv?${params.toString()}`, '_blank');
    },
  },

  // Employers
  employers: {
    getStats: () =>
      apiClient.get<Array<{
        company: string;
        totalApplications: number;
        totalVacancies: number;
        viewedCount: number;
        invitedCount: number;
        rejectedCount: number;
        viewRate: number;
        inviteRate: number;
        avgResponseTimeDays: number | null;
      }>>('/api/employers/stats'),
    getDetails: (company: string) =>
      apiClient.get<{
        company: string;
        applications: any[];
        totalCount: number;
      }>(`/api/employers/${encodeURIComponent(company)}`),
  },

  // Search
  search: {
    getHistory: (limit = 10) =>
      apiClient.get<Array<{
        id: string;
        text: string | null;
        area: string | null;
        salary: number | null;
        experience: string | null;
        schedule: string | null;
        name: string | null;
        resultCount: number | null;
        useCount: number;
        createdAt: string;
        lastUsedAt: string;
      }>>('/api/search/history', { params: { limit } }),
    saveHistory: (data: {
      text?: string;
      area?: string;
      salary?: number;
      experience?: string;
      schedule?: string;
      name?: string;
      resultCount?: number;
    }) => apiClient.post('/api/search/history', data),
    updateHistoryName: (id: string, name: string) =>
      apiClient.put(`/api/search/history/${id}`, { name }),
    deleteHistory: (id: string) => apiClient.delete(`/api/search/history/${id}`),
    getDrafts: () =>
      apiClient.get<Array<{
        id: string;
        vacancyId: string;
        vacancyTitle: string;
        vacancyCompany: string;
        vacancyUrl: string;
        resumeId: string | null;
        message: string | null;
        createdAt: string;
        updatedAt: string;
      }>>('/api/search/drafts'),
    saveDraft: (data: {
      vacancyId: string;
      vacancyTitle: string;
      vacancyCompany: string;
      vacancyUrl: string;
      resumeId?: string;
      message?: string;
    }) => apiClient.post('/api/search/drafts', data),
    deleteDraft: (id: string) => apiClient.delete(`/api/search/drafts/${id}`),
  },
};
