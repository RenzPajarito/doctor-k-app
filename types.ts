export interface MenuItemOption {
  id: string;
  name: string;
  isRequired?: boolean;
  maxSelections?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  options?: MenuItemOption[];
} 