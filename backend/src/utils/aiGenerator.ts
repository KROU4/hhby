import axios from 'axios';
import { logger } from './logger';

export interface VacancyData {
  title: string;
  company: string;
  description?: string;
  requirements?: string;
  salary?: string;
  experience?: string;
  schedule?: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  experience?: string;
  skills?: string[];
}

export interface CoverLetterOptions {
  style?: 'professional' | 'friendly' | 'creative' | 'concise';
  length?: 'short' | 'medium' | 'long';
  customPrompt?: string;
  includeSkills?: boolean;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate a cover letter using OpenAI GPT
 */
export async function generateCoverLetter(
  vacancy: VacancyData,
  userProfile: UserProfile,
  options: CoverLetterOptions = {},
  userApiKey?: string
): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = userApiKey || OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API ключ не настроен. Добавьте OPENAI_API_KEY в .env или укажите в настройках.');
  }

  const style = options.style || 'professional';
  const length = options.length || 'medium';

  // Build context from vacancy data
  const vacancyContext = buildVacancyContext(vacancy);
  const profileContext = buildProfileContext(userProfile);

  // Generate system prompt based on style
  const systemPrompt = buildSystemPrompt(style, length);

  // Build user prompt
  const userPrompt = options.customPrompt || buildUserPrompt(vacancyContext, profileContext, options);

  try {
    logger.info('Generating cover letter with OpenAI', {
      vacancy: vacancy.title,
      company: vacancy.company,
      style,
      length,
    });

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // More cost-effective model
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(length),
        top_p: 1,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000, // 30 seconds
      }
    );

    const generatedText = response.data.choices[0].message.content.trim();
    const tokensUsed = response.data.usage.total_tokens;

    logger.info('Cover letter generated successfully', {
      tokensUsed,
      length: generatedText.length,
    });

    return {
      text: generatedText,
      tokensUsed,
    };
  } catch (error: any) {
    logger.error('OpenAI API error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Неверный OpenAI API ключ. Проверьте настройки.');
    } else if (error.response?.status === 429) {
      throw new Error('Превышен лимит запросов OpenAI. Попробуйте позже.');
    } else if (error.response?.status === 400) {
      throw new Error('Ошибка в запросе к OpenAI: ' + (error.response.data.error?.message || 'Неизвестная ошибка'));
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: OpenAI API не ответил вовремя. Попробуйте еще раз.');
    }

    throw new Error('Ошибка генерации письма: ' + (error.message || 'Неизвестная ошибка'));
  }
}

/**
 * Build vacancy context from data
 */
function buildVacancyContext(vacancy: VacancyData): string {
  const parts: string[] = [];

  parts.push(`Вакансия: ${vacancy.title}`);
  parts.push(`Компания: ${vacancy.company}`);

  if (vacancy.salary) {
    parts.push(`Зарплата: ${vacancy.salary}`);
  }

  if (vacancy.experience) {
    parts.push(`Опыт: ${vacancy.experience}`);
  }

  if (vacancy.schedule) {
    parts.push(`График: ${vacancy.schedule}`);
  }

  if (vacancy.description) {
    parts.push(`\nОписание вакансии:\n${vacancy.description.substring(0, 800)}`);
  }

  if (vacancy.requirements) {
    parts.push(`\nТребования:\n${vacancy.requirements.substring(0, 500)}`);
  }

  return parts.join('\n');
}

/**
 * Build user profile context
 */
function buildProfileContext(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.firstName || profile.lastName) {
    parts.push(`Имя: ${[profile.firstName, profile.lastName].filter(Boolean).join(' ')}`);
  }

  if (profile.experience) {
    parts.push(`Опыт работы: ${profile.experience}`);
  }

  if (profile.skills && profile.skills.length > 0) {
    parts.push(`Навыки: ${profile.skills.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Build system prompt based on style
 */
function buildSystemPrompt(style: string, length: string): string {
  const basePrompt = 'Ты - профессиональный HR-консультант и копирайтер, специализирующийся на написании эффективных сопроводительных писем для откликов на вакансии.';

  const stylePrompts = {
    professional: 'Используй деловой, профессиональный стиль. Будь формальным, но не слишком жестким. Покажи компетентность и серьезность кандидата.',
    friendly: 'Используй дружелюбный, но профессиональный стиль. Будь теплым и открытым, показывая энтузиазм. Избегай излишней формальности.',
    creative: 'Используй креативный, запоминающийся стиль. Будь оригинальным и выделяйся среди других кандидатов. Покажи индивидуальность.',
    concise: 'Используй лаконичный, сжатый стиль. Избегай лишних слов. Каждое предложение должно нести ценность. Будь конкретным и точным.',
  };

  const lengthGuides = {
    short: 'Письмо должно быть кратким - 3-4 абзаца, около 100-150 слов.',
    medium: 'Письмо должно быть средней длины - 4-5 абзацев, около 150-250 слов.',
    long: 'Письмо должно быть развернутым - 5-6 абзацев, около 250-350 слов.',
  };

  return `${basePrompt}

${stylePrompts[style as keyof typeof stylePrompts]}

${lengthGuides[length as keyof typeof lengthGuides]}

Структура письма:
1. Приветствие
2. Краткое представление и почему заинтересовала вакансия
3. Релевантный опыт и навыки
4. Что можешь принести компании
5. Призыв к действию и благодарность

ВАЖНО:
- Пиши на русском языке
- Не используй шаблонные фразы вроде "Я идеальный кандидат"
- Фокусируйся на ценности для работодателя, а не на своих желаниях
- Используй конкретные примеры, если есть информация
- Избегай излишней скромности, но и не хвастайся
- Письмо должно быть уникальным и релевантным конкретной вакансии`;
}

/**
 * Build user prompt
 */
function buildUserPrompt(
  vacancyContext: string,
  profileContext: string,
  options: CoverLetterOptions
): string {
  let prompt = `Напиши сопроводительное письмо для отклика на следующую вакансию:

${vacancyContext}`;

  if (profileContext) {
    prompt += `\n\nИнформация о кандидате:\n${profileContext}`;
  }

  if (options.includeSkills) {
    prompt += '\n\nОБЯЗАТЕЛЬНО упомяни релевантные навыки из профиля кандидата, если они есть.';
  }

  prompt += '\n\nНапиши сопроводительное письмо, которое увеличит шансы получить приглашение на собеседование.';

  return prompt;
}

/**
 * Get max tokens based on length
 */
function getMaxTokens(length: string): number {
  const tokenLimits = {
    short: 300,
    medium: 500,
    long: 700,
  };

  return tokenLimits[length as keyof typeof tokenLimits] || 500;
}

/**
 * Validate OpenAI API key format
 */
export function validateOpenAiApiKey(apiKey: string): boolean {
  // OpenAI keys start with "sk-" and are typically 48-51 characters
  return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey);
}

/**
 * Estimate cost for generation (in USD)
 */
export function estimateCost(tokensUsed: number): number {
  // GPT-4o-mini pricing (as of 2024):
  // Input: $0.150 per 1M tokens
  // Output: $0.600 per 1M tokens
  // Average: ~$0.375 per 1M tokens

  const costPerMillionTokens = 0.375;
  return (tokensUsed / 1_000_000) * costPerMillionTokens;
}
