import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online': return 'text-green-500';
    case 'offline': return 'text-gray-400';
    case 'under_attack': case 'attack': return 'text-red-500';
    case 'quarantined': return 'text-amber-500';
    default: return 'text-gray-400';
  }
}

export function getStatusDotClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'online': return 'status-dot status-online';
    case 'offline': return 'status-dot status-offline';
    case 'under_attack': case 'attack': return 'status-dot status-attack';
    case 'quarantined': return 'status-dot status-quarantined';
    default: return 'status-dot status-offline';
  }
}
