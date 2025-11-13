// Типы для HH.ru API

export interface HHTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface HHUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
}

export interface HHResume {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface HHVacancy {
  id: string;
  name: string;
  employer: {
    id: string;
    name: string;
    url?: string;
  };
  salary?: {
    from?: number;
    to?: number;
    currency: string;
    gross: boolean;
  };
  area: {
    id: string;
    name: string;
  };
  url: string;
  alternate_url: string;
  published_at: string;
  snippet?: {
    requirement?: string;
    responsibility?: string;
  };
}

export interface HHVacancySearchParams {
  text?: string;
  area?: string;
  salary?: number;
  experience?: string;
  schedule?: string;
  per_page?: number;
  page?: number;
}

export interface HHNegotiation {
  id: string;
  state: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  vacancy: HHVacancy;
  resume: {
    id: string;
    title: string;
  };
  viewed_by_employer: boolean;
  messages_url: string;
}

export interface SearchFilters {
  text?: string;
  area?: string;
  salary?: number;
  experience?: 'noExperience' | 'between1And3' | 'between3And6' | 'moreThan6';
  schedule?: 'fullDay' | 'shift' | 'flexible' | 'remote' | 'flyInFlyOut';
  employment?: 'full' | 'part' | 'project' | 'volunteer' | 'probation';
}

export interface AutoResponseSettings {
  enabled: boolean;
  maxResponsesPerDay: number;
  searchFilters?: SearchFilters;
  excludeKeywords?: string[];
  blacklistEmployers?: string[];
  coverLetterTemplate?: string;
  useAiGeneration: boolean;
  scheduleEnabled: boolean;
  scheduleTime?: string[];
}
