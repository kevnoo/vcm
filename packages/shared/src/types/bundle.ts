import { ItemDefinition } from './item';

export interface BundleItem {
  id: string;
  bundleId: string;
  itemDefinitionId: string;
  quantity: number;
  itemDefinition?: ItemDefinition;
}

export interface Bundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  items?: BundleItem[];
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateBundleItemDto {
  itemDefinitionId: string;
  quantity: number;
}

export interface CreateBundleDto {
  name: string;
  description?: string;
  price: number;
  items: CreateBundleItemDto[];
}

export interface UpdateBundleDto {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
  items?: CreateBundleItemDto[];
}

export interface BuyBundleDto {
  bundleId: string;
  quantity: number;
}

export interface PosTransactionItemDto {
  itemDefinitionId: string;
  quantity: number;
}

export interface PosBundleDto {
  bundleId: string;
  quantity: number;
}

export interface PosCheckoutDto {
  teamId: string;
  items: PosTransactionItemDto[];
  bundles: PosBundleDto[];
}
