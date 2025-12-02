

import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export type PropertyType = 'residential' | 'commercial';
export type TransactionType = 'sale' | 'rent' | 'mortgage' | 'presale' | 'participation';

export interface Property {
  id: string;
  category: PropertyType;
  title: string;
  type: string;
  transactionType: TransactionType;
  address: string;
  area: number;
  priceTotal?: number;
  priceDeposit?: number;
  priceRent?: number;
  features: string[];
  images: string[];
  ownerName: string;
  ownerPhone: string;
  description: string;
  date: string;
  lat?: number;
  lng?: number;
  
  // Residential specific
  bedrooms?: number;
  floor?: number;
  yearBuilt?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasStorage?: boolean;
  deedStatus?: string;
  
  // Commercial specific
  frontage?: number;
  length?: number;
  height?: number;
  hasOpenCeiling?: boolean;
  locationType?: string;
  commercialDeedType?: string;
  status?: string;
  facilities?: string[];

  // Sales tracking
  dateSold?: string;
  user_id?: string; // Supabase owner
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  requestType: TransactionType;
  propertyType: PropertyType;
  budgetMin?: number;
  budgetMax?: number;
  areaMin?: number;
  areaMax?: number;
  locationPref: string;
  essentials: string;
  description: string;
  date: string;
  reminders?: Reminder[];
  user_id?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  isCompleted: boolean;
}

export interface Commission {
  id: string;
  buyerName: string;
  sellerName: string;
  contractDate: string;
  propertyPrice: number;
  totalCommission: number;
  agentPercentage: number;
  agentShare: number;
  isPaid: boolean;
  user_id?: string;
}

export enum NavTab {
  HOME = 'home',
  PROPERTIES = 'properties',
  ADD = 'add',
  CLIENTS = 'clients',
  TASKS = 'tasks',
  COMMISSION = 'commission'
}

export interface SearchFilters {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  type?: PropertyType | 'all';
  transactionType?: TransactionType;
  bedrooms?: number;
  minYear?: number;
}

export interface SavedSearch {
  id: string;
  title: string;
  filters: SearchFilters;
}

export interface FormProps<T> {
  onSubmit: (data: Partial<T>) => void;
  onCancel: () => void;
  initialData?: Partial<T> | null;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'schedule' | 'routine' | 'reminder';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  date: string;
  time: string;
  priority: TaskPriority;
  description: string;
  isCompleted: boolean;
  user_id?: string;
}

export type UserRole = 'admin' | 'secretary';

export interface User {
  id: string; // UUID from Supabase Auth
  email?: string;
  name: string;
  username: string;
  role: UserRole;
  lat?: number; // For Live Tracking
  lng?: number;
  last_seen?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
}

export interface AppContext {
  properties: Property[];
  clients: Client[];
  tasks: Task[];
  currentUser: User | null;
}

export enum AIModelType {
  TEXT_CHAT = 'TEXT_CHAT',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  VIRTUAL_STAGING = 'VIRTUAL_STAGING', // Specific for staging use cases
}

export interface AIKeyConfig {
  apiKey: string;
  model: string; // e.g., 'gemini-3-pro-preview', 'gemini-2.5-flash-image'
  isValid: boolean;
  error: string | null;
}

// Interface for AI Studio window object
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}