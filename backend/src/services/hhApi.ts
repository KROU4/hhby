import axios, { AxiosInstance } from 'axios';
import {
  HHTokenResponse,
  HHUser,
  HHResume,
  HHVacancy,
  HHVacancySearchParams,
  HHNegotiation
} from '../types';
import { logger } from '../utils/logger';

export class HHApiService {
  private client: AxiosInstance;
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://api.hh.ru',
      headers: {
        'User-Agent': 'HHAutoResponder/1.0',
      },
    });

    if (accessToken) {
      this.setAccessToken(accessToken);
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // OAuth: Получение токена по коду авторизации
  async getAccessToken(code: string): Promise<HHTokenResponse> {
    try {
      const response = await axios.post<HHTokenResponse>('https://hh.ru/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.HH_CLIENT_ID,
          client_secret: process.env.HH_CLIENT_SECRET,
          code,
          redirect_uri: process.env.HH_REDIRECT_URI,
        },
      });
      logger.info('Successfully obtained access token');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get access token:', error.response?.data || error.message);
      throw new Error('Failed to get access token from HH.ru');
    }
  }

  // OAuth: Обновление токена
  async refreshAccessToken(refreshToken: string): Promise<HHTokenResponse> {
    try {
      const response = await axios.post<HHTokenResponse>('https://hh.ru/oauth/token', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
      });
      logger.info('Successfully refreshed access token');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to refresh access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  // Получить информацию о текущем пользователе
  async getMe(): Promise<HHUser> {
    try {
      const response = await this.client.get<HHUser>('/me');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user info:', error.response?.data || error.message);
      throw new Error('Failed to get user info from HH.ru');
    }
  }

  // Получить резюме пользователя
  async getMyResumes(): Promise<HHResume[]> {
    try {
      const response = await this.client.get<{ items: HHResume[] }>('/resumes/mine');
      return response.data.items;
    } catch (error: any) {
      logger.error('Failed to get resumes:', error.response?.data || error.message);
      throw new Error('Failed to get resumes from HH.ru');
    }
  }

  // Поиск вакансий
  async searchVacancies(params: HHVacancySearchParams): Promise<{
    items: HHVacancy[];
    found: number;
    pages: number;
    page: number;
  }> {
    try {
      const response = await this.client.get('/vacancies', { params });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to search vacancies:', error.response?.data || error.message);
      throw new Error('Failed to search vacancies');
    }
  }

  // Получить детальную информацию о вакансии
  async getVacancy(vacancyId: string): Promise<HHVacancy> {
    try {
      const response = await this.client.get(`/vacancies/${vacancyId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get vacancy:', error.response?.data || error.message);
      throw new Error('Failed to get vacancy');
    }
  }

  // Отправить отклик на вакансию
  async applyToVacancy(
    vacancyId: string,
    resumeId: string,
    message?: string
  ): Promise<HHNegotiation> {
    try {
      const response = await this.client.post('/negotiations', {
        vacancy_id: vacancyId,
        resume_id: resumeId,
        message: message || '',
      });
      logger.info(`Successfully applied to vacancy ${vacancyId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to apply to vacancy:', error.response?.data || error.message);
      throw new Error(error.response?.data?.description || 'Failed to apply to vacancy');
    }
  }

  // Получить список откликов
  async getMyNegotiations(status?: 'active'): Promise<HHNegotiation[]> {
    try {
      const params = status ? { status } : {};
      const response = await this.client.get<{ items: HHNegotiation[] }>('/negotiations', { params });
      return response.data.items;
    } catch (error: any) {
      logger.error('Failed to get negotiations:', error.response?.data || error.message);
      throw new Error('Failed to get negotiations');
    }
  }
}
