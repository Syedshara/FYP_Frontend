import api from './client';
import type { PredictRequest, PredictResponse, Prediction, PredictionSummary, ModelInfo } from '@/types';

export const predictionsApi = {
  predict: (data: PredictRequest) =>
    api.post<PredictResponse>('/predictions/predict', data).then((r) => r.data),

  model: () =>
    api.get<ModelInfo>('/predictions/model').then((r) => r.data),

  summary: () =>
    api.get<PredictionSummary>('/predictions/summary').then((r) => r.data),

  deviceHistory: (deviceId: string, limit = 100) =>
    api.get<Prediction[]>(`/predictions/device/${deviceId}?limit=${limit}`).then((r) => r.data),
};
