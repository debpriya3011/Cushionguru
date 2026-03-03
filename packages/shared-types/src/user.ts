/**
 * User and Authentication Types
 */

// ==================== USER ROLES ====================

export type UserRole = 'SUPER_ADMIN' | 'RETAILER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

// ==================== USER ====================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  
  // Profile
  firstName?: string;
  lastName?: string;
  phone?: string;
  
  // Retailer relation
  retailerId?: string;
  retailer?: Retailer;
  
  // Timestamps
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRetailer extends User {
  retailer: Retailer;
}

// ==================== RETAILER ====================

export type RetailerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type MarkupType = 'PERCENTAGE' | 'FIXED';

export interface Retailer {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  
  // Address
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  
  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  
  // Markup settings
  markupType: MarkupType;
  markupValue: number;
  
  // Status
  status: RetailerStatus;
  
  // Stats
  _count?: {
    quotes: number;
    orders: number;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ==================== AUTH ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
  redirectUrl: string;
}

export interface InvitationRequest {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  markupType?: MarkupType;
  markupValue?: number;
}

export interface InvitationResponse {
  retailer: Retailer;
  invitationToken: string;
  invitationUrl: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}

// ==================== SESSION ====================

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  retailerId?: string;
  retailer?: Retailer;
}

// ==================== API TYPES ====================

export interface CreateRetailerRequest {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  markupType?: MarkupType;
  markupValue?: number;
}

export interface UpdateRetailerRequest {
  businessName?: string;
  contactName?: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  markupType?: MarkupType;
  markupValue?: number;
  status?: RetailerStatus;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface RetailerListResponse {
  retailers: Retailer[];
  total: number;
  page: number;
  limit: number;
}

export interface RetailerStats {
  totalQuotes: number;
  totalOrders: number;
  totalRevenue: number;
  pendingQuotes: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'QUOTE_CREATED' | 'ORDER_PLACED' | 'STATUS_CHANGED';
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
