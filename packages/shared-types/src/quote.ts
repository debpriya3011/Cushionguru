/**
 * Quote and Order Types
 */

import { CalculatorSelections, CalculatedValues, CustomerDetails } from './calculator';

// ==================== QUOTE STATUS ====================

export type QuoteStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'ACCEPTED' 
  | 'EXPIRED' 
  | 'CONVERTED';

// ==================== QUOTE ITEM ====================

export interface QuoteItem {
  id: string;
  quoteId: string;
  
  // Selections (denormalized for history)
  productType: string;
  shape: string;
  dimensions: {
    length?: number;
    width?: number;
    thickness?: number;
    diameter?: number;
    bottomWidth?: number;
    topWidth?: number;
    ear?: number;
  };
  foamType: string;
  fabricId: string;
  fabricCode: string;
  fabricName?: string;
  zipperPosition: string;
  piping: string;
  ties: string;
  
  // Calculated values
  fabricMeters: number;
  quantity: number;
  
  // Costs (base costs - hidden from retailer in PDF)
  baseSewingCost: number;
  baseFiberfillCost: number;
  basePipingCost: number;
  baseTiesCost: number;
  baseFabricCost: number;
  baseSubtotal: number;
  
  // Final pricing (with markup)
  unitPrice: number;
  totalPrice: number;
  
  // Instructions
  instructions?: string;
  attachmentUrls: string[];
  
  // 3D Preview
  preview3DUrl?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ==================== QUOTE ====================

export interface Quote {
  id: string;
  quoteNumber: string;
  
  // Relations
  retailerId: string;
  retailer?: {
    businessName: string;
    email: string;
  };
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Items
  items: QuoteItem[];
  
  // Pricing
  subtotal: number;
  markupAmount: number;
  total: number;
  
  // Status
  status: QuoteStatus;
  
  // PDF
  pdfUrl?: string;
  
  // Conversion
  convertedToOrderId?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// ==================== ORDER STATUS ====================

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY_FOR_SHIPPING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type ProductionStatus = 
  | 'PENDING'
  | 'CUTTING'
  | 'SEWING'
  | 'FILLING'
  | 'QUALITY_CHECK'
  | 'COMPLETE';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// ==================== ORDER ITEM ====================

export interface OrderItem {
  id: string;
  orderId: string;
  
  // Copied from QuoteItem
  productType: string;
  shape: string;
  dimensions: {
    length?: number;
    width?: number;
    thickness?: number;
    diameter?: number;
    bottomWidth?: number;
    topWidth?: number;
    ear?: number;
  };
  foamType: string;
  fabricCode: string;
  zipperPosition: string;
  piping: string;
  ties: string;
  fabricMeters: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  instructions?: string;
  attachmentUrls: string[];
  
  // Production
  productionStatus: ProductionStatus;
  productionNotes?: string;
  assignedTo?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ==================== ORDER ====================

export interface Order {
  id: string;
  orderNumber: string;
  
  // Relations
  retailerId: string;
  retailer?: {
    businessName: string;
    email: string;
  };
  quoteId?: string;
  quote?: Quote;
  
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Items
  items: OrderItem[];
  
  // Pricing
  subtotal: number;
  markupAmount: number;
  total: number;
  
  // Status
  status: OrderStatus;
  priority: Priority;
  
  // Production
  productionNotes?: string;
  
  // Shipping
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  trackingNumber?: string;
  shippedAt?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ==================== API REQUESTS/RESPONSES ====================

export interface CreateQuoteRequest {
  items: Array<{
    selections: CalculatorSelections;
    calculations: CalculatedValues;
  }>;
  customerDetails: CustomerDetails;
}

export interface CreateQuoteResponse {
  quote: Quote;
  pdfUrl?: string;
}

export interface UpdateQuoteRequest {
  status?: QuoteStatus;
  items?: Array<{
    selections: CalculatorSelections;
    calculations: CalculatedValues;
  }>;
  customerDetails?: Partial<CustomerDetails>;
}

export interface ConvertQuoteRequest {
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  priority?: Priority;
  productionNotes?: string;
}

export interface QuoteListResponse {
  quotes: Quote[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  priority?: Priority;
  productionNotes?: string;
  trackingNumber?: string;
}

export interface UpdateOrderItemRequest {
  productionStatus?: ProductionStatus;
  productionNotes?: string;
  assignedTo?: string;
}

// ==================== STATS ====================

export interface QuoteStats {
  totalQuotes: number;
  quotesByStatus: Record<QuoteStatus, number>;
  totalRevenue: number;
  averageQuoteValue: number;
  conversionRate: number;
}

export interface OrderStats {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  inProductionOrders: number;
}

export interface DashboardStats {
  quotes: QuoteStats;
  orders: OrderStats;
  recentQuotes: Quote[];
  recentOrders: Order[];
}
