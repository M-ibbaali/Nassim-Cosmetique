export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'staff';
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  selling_price: number;
  purchase_price: number;
  stock_quantity: number;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Sale {
  id: string;
  total: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
  purchase_price_snapshot: number;
  selling_price_snapshot: number;
  subtotal: number;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface DailyRevenue {
  day: string;
  sales_count: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface BestProduct {
  id: string;
  name: string;
  image_url?: string | null;
  total_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
}

export interface SaleWithItems extends Sale {
  sale_items: (SaleItem & { product: Product & { category?: Category } })[];
}

export interface AnalyticsSummary {
  todayRevenue: number;
  todaySalesCount: number;
  todayProfit: number;
  weekRevenue: number;
  monthRevenue: number;
  netProfit: number;
  profitMargin: number;
  lowStockCount: number;
}

export interface ProfitTrend {
  day: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitOverview {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  avg_profit_margin: number;
}
