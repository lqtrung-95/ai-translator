import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(config?: ApiConfig) {
    this.client = axios.create({
      baseURL: config?.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: config?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证令牌
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 响应拦截器 - 处理错误
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        throw error;
      }
    );
  }

  // 认证 API
  async login(email: string, password: string) {
    const response = await this.client.post<any>('/auth/login', {
      email,
      password,
    });
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }
    return response;
  }

  async register(email: string, name: string, password: string) {
    const response = await this.client.post<any>('/auth/register', {
      email,
      name,
      password,
    });
    return response;
  }

  // 翻译 API
  async createTranslation(data: {
    title: string;
    sourceUrl?: string;
    sourceFormat?: string;
    paragraphs?: Array<any>;
  }) {
    return this.client.post('/translations', data);
  }

  async getTranslation(id: string) {
    return this.client.get(`/translations/${id}`);
  }

  async getUserTranslations(limit: number = 20, offset: number = 0) {
    return this.client.get('/translations', {
      params: { limit, offset },
    });
  }

  async translateDocument(
    id: string,
    options: {
      mode?: 'professional' | 'casual' | 'summary';
      provider?: 'gemini' | 'claude' | 'openai';
    } = {}
  ) {
    return this.client.post(`/translations/${id}/translate`, options);
  }

  async instantTranslate(data: {
    text: string;
    mode?: 'professional' | 'casual' | 'summary';
    provider?: 'gemini' | 'claude' | 'openai';
    sourceLanguage?: string;
    targetLanguage?: string;
    context?: string;
  }) {
    return this.client.post<{ translated: string; confidence: number; provider: string }>(
      '/instant-translation',
      data
    );
  }

  async updateParagraph(
    documentId: string,
    paragraphId: string,
    data: {
      translated: string;
      notes?: string;
    }
  ) {
    return this.client.put(
      `/translations/${documentId}/paragraphs/${paragraphId}`,
      data
    );
  }

  async deleteTranslation(id: string) {
    return this.client.delete(`/translations/${id}`);
  }

  // 术语库 API
  async getGlossary(limit: number = 100, offset: number = 0) {
    return this.client.get('/glossary', {
      params: { limit, offset },
    });
  }

  async searchGlossary(query: string) {
    return this.client.get('/glossary/search', {
      params: { q: query },
    });
  }

  async addCustomTerm(data: {
    english: string;
    chinese: string;
    category: string;
    explanation: string;
    examples?: string[];
  }) {
    return this.client.post('/glossary/custom', data);
  }

  async addGlossaryTerm(data: {
    english: string;
    chinese: string;
    category: string;
    explanation?: string;
  }) {
    return this.client.post('/glossary', data);
  }

  async deleteGlossaryTerm(id: string) {
    return this.client.delete(`/glossary/${id}`);
  }

  // 用户 API
  async getCurrentUser() {
    return this.client.get('/users/me');
  }

  async updateProfile(data: Record<string, any>) {
    return this.client.put('/users/me', data);
  }

  // 工具方法
  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // 流式翻译（用于实时显示进度）
  async *translateParagraphStream(
    documentId: string,
    paragraphId: string,
    options: {
      mode?: 'professional' | 'casual' | 'summary';
    } = {}
  ) {
    const response = await fetch(
      `${this.client.defaults.baseURL}/translations/${documentId}/paragraphs/${paragraphId}/translate-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(options),
      }
    );

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  }
}

// 导出单例
export const apiClient = new ApiClient();
