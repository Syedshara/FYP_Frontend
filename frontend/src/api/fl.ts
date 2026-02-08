import api from './client';
import type { FLRound, FLRoundDetail, FLStatus, FLClient } from '@/types';

export const flApi = {
  status: () =>
    api.get<FLStatus>('/fl/status').then((r) => r.data),

  rounds: () =>
    api.get<FLRound[]>('/fl/rounds').then((r) => r.data),

  round: (roundNumber: number) =>
    api.get<FLRoundDetail>(`/fl/rounds/${roundNumber}`).then((r) => r.data),

  clients: () =>
    api.get<FLClient[]>('/fl/clients').then((r) => r.data),
};
