export interface User {
  id: string;
  email?: string;
  hhUserId?: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  hhResumeId?: string;
  title: string;
  fileUrl?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vacancy {
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

export interface VacancySearchParams {
  text?: string;
  area?: string;
  salary?: number;
  experience?: string;
  schedule?: string;
  per_page?: number;
  page?: number;
}

export interface SearchFilters {
  text?: string;
  area?: string;
  salary?: number;
  experience?: 'noExperience' | 'between1And3' | 'between3And6' | 'moreThan6';
  schedule?: 'fullDay' | 'shift' | 'flexible' | 'remote' | 'flyInFlyOut';
  employment?: 'full' | 'part' | 'project' | 'volunteer' | 'probation';
}

export interface Settings {
  id: string;
  userId: string;
  enabled: boolean;
  maxResponsesPerDay: number;
  searchFilters?: SearchFilters;
  excludeKeywords?: string[];
  blacklistEmployers?: string[];
  coverLetterTemplate?: string;
  useAiGeneration: boolean;
  scheduleEnabled: boolean;
  scheduleTime?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: string;
  letterContent?: string;
  sentAt: string;
  viewedAt?: string;
  respondedAt?: string;
  job?: {
    id: string;
    hhJobId: string;
    title: string;
    company: string;
    salary?: string;
    location?: string;
    url: string;
  };
  resume?: Resume;
}

export interface Analytics {
  daily: {
    id: string;
    userId: string;
    date: string;
    responsesCount: number;
    viewsCount: number;
    invitationsCount: number;
    rejectionsCount: number;
  }[];
  total: {
    responses: number;
    views: number;
    invitations: number;
    rejections: number;
  };
}
