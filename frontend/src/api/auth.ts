import api from './client';
import type { UserLogin, UserCreate, TokenResponse, User } from '@/types';

export const authApi = {
  login: (data: UserLogin) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  register: (data: UserCreate) =>
    api.post<User>('/auth/register', data).then((r) => r.data),

  me: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),
};
