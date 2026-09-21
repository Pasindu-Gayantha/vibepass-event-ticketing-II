import type { VibeEvent } from '@/types';

export function formatLKR(amount: number): string {
  return `LKR ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getCountdown(dateStr: string): { days: number; hours: number; minutes: number; seconds: number } {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export function getUrgencyLabel(event: VibeEvent): { text: string; color: string } {
  if (event.tickets_remaining <= 5) {
    return { text: `Only ${event.tickets_remaining} tickets left!`, color: 'red' };
  }
  if (event.tickets_remaining <= 15) {
    return { text: 'Selling Fast', color: 'rose' };
  }
  return { text: 'Available', color: 'emerald' };
}
