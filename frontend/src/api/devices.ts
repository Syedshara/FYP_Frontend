import api from './client';
import type { Device, DeviceCreate, DeviceUpdate } from '@/types';

export const devicesApi = {
  list: () =>
    api.get<Device[]>('/devices/').then((r) => r.data),

  get: (id: string) =>
    api.get<Device>(`/devices/${id}`).then((r) => r.data),

  create: (data: DeviceCreate) =>
    api.post<Device>('/devices/', data).then((r) => r.data),

  update: (id: string, data: DeviceUpdate) =>
    api.patch<Device>(`/devices/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/devices/${id}`),
};
