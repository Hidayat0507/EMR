import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function safeToISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null
  try {
    const d = new Date(date)
    return d.toISOString()
  } catch (e) {
    return null
  }
}

export function calculateAge(birthDate: Date | string | null | undefined): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}
