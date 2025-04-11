import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to calculate age from a Date object
export function calculateAge(dob: Date | undefined | null): number | string {
  if (!dob || !(dob instanceof Date) || isNaN(dob.getTime())) { 
    // Return 'N/A' or 0 or handle error appropriately if dob is invalid/missing
    return 'N/A'; 
  }
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0; // Ensure age is not negative
}

// Function to format Date objects or date strings for display
export function formatDisplayDate(dateInput: Date | string | undefined | null): string {
  if (!dateInput) {
    return 'N/A'; // Or '-', or empty string depending on preference
  }
  try {
    // Handle cases where the input might already be a Date object from Firestore conversion
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    // Adjust options as needed (e.g., locale, dateStyle)
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
}
