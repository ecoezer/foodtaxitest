import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MenuItem, PizzaSize } from '../types';

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  selectedSize?: PizzaSize;
  selectedIngredients?: string[];
  selectedExtras?: string[];
  selectedPastaType?: string;
  selectedSauce?: string;
  selectedSpecialRequest?: string;
}

interface CartState {
  items: OrderItem[];
  addItem: (menuItem: MenuItem, selectedSize?: PizzaSize, selectedIngredients?: string[], selectedExtras?: string[], selectedPastaType?: string, selectedSauce?: string, selectedSpecialRequest?: string) => void;
  removeItem: (id: number, selectedSize?: PizzaSize, selectedIngredients?: string[], selectedExtras?: string[], selectedPastaType?: string, selectedSauce?: string, selectedSpecialRequest?: string) => void;
  updateQuantity: (id: number, quantity: number, selectedSize?: PizzaSize, selectedIngredients?: string[], selectedExtras?: string[], selectedPastaType?: string, selectedSauce?: string, selectedSpecialRequest?: string) => void;
  clearCart: () => void;
}

// Helper function to create a unique key for cart items
const getItemKey = (menuItem: MenuItem, selectedSize?: PizzaSize, selectedIngredients?: string[], selectedExtras?: string[], selectedPastaType?: string, selectedSauce?: string, selectedSpecialRequest?: string) => {
  const sizeKey = selectedSize ? selectedSize.name : 'default';
  const ingredientsKey = selectedIngredients && selectedIngredients.length > 0 
    ? selectedIngredients.sort().join(',') 
    : 'none';
  const extrasKey = selectedExtras && selectedExtras.length > 0
    ? selectedExtras.sort().join(',')
    : 'none';
  const pastaTypeKey = selectedPastaType || 'none';
  const sauceKey = selectedSauce || 'none';
  const specialRequestKey = selectedSpecialRequest || 'none';
  return `${menuItem.id}-${sizeKey}-${ingredientsKey}-${extrasKey}-${pastaTypeKey}-${sauceKey}-${specialRequestKey}`;
};

// Helper function to find item in cart
const findItemIndex = (items: OrderItem[], menuItem: MenuItem, selectedSize?: PizzaSize, selectedIngredients?: string[], selectedExtras?: string[], selectedPastaType?: string, selectedSauce?: string, selectedSpecialRequest?: string) => {
  return items.findIndex(item => {
    const itemKey = getItemKey(item.menuItem, item.selectedSize, item.selectedIngredients, item.selectedExtras, item.selectedPastaType, item.selectedSauce, item.selectedSpecialRequest);
    const searchKey = getItemKey(menuItem, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest);
    return itemKey === searchKey;
  });
};

export const useCartStore = create<CartState>()(
  persist(
    set => ({
      items: [],

      addItem: (menuItem, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest) =>
        set(state => {
          const currentItems = [...state.items];
          const existingItemIndex = findItemIndex(currentItems, menuItem, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest);

          if (existingItemIndex >= 0) {
            currentItems[existingItemIndex] = {
              ...currentItems[existingItemIndex],
              quantity: currentItems[existingItemIndex].quantity + 1
            };
          } else {
            // Create new item with selected size price if applicable
            const itemToAdd = { ...menuItem };
            if (selectedSize) {
              itemToAdd.price = selectedSize.price;
            }
            
            // Add extras cost (each extra is €1.50)
            if (selectedExtras && selectedExtras.length > 0) {
              itemToAdd.price += selectedExtras.length * 1.50;
            }
            
            // Add special request cost
            if (selectedSpecialRequest && selectedSpecialRequest !== 'Standard') {
              const pizzaSpecialRequests = [
                { name: 'Standard', price: 0 },
                { name: 'Käserand', price: 2.00 },
                { name: 'Americanstyle', price: 1.50 },
                { name: 'als Calzone', price: 1.00 }
              ];
              const specialRequest = pizzaSpecialRequests.find(req => req.name === selectedSpecialRequest);
              if (specialRequest) {
                itemToAdd.price += specialRequest.price;
              }
            }
            
            currentItems.push({ 
              menuItem: itemToAdd, 
              quantity: 1,
              selectedSize,
              selectedIngredients: selectedIngredients || [],
              selectedExtras: selectedExtras || [],
              selectedPastaType,
              selectedSauce,
              selectedSpecialRequest
            });
          }

          return { items: currentItems };
        }),

      removeItem: (id, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest) =>
        set(state => ({
          items: state.items.filter(item => {
            const itemKey = getItemKey(item.menuItem, item.selectedSize, item.selectedIngredients, item.selectedExtras, item.selectedPastaType, item.selectedSauce, item.selectedSpecialRequest);
            const searchKey = getItemKey({ id } as MenuItem, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest);
            return itemKey !== searchKey;
          })
        })),

      updateQuantity: (id, quantity, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest) =>
        set(state => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(item => {
                const itemKey = getItemKey(item.menuItem, item.selectedSize, item.selectedIngredients, item.selectedExtras, item.selectedPastaType, item.selectedSauce, item.selectedSpecialRequest);
                const searchKey = getItemKey({ id } as MenuItem, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest);
                return itemKey !== searchKey;
              })
            };
          }

          return {
            items: state.items.map(item => {
              const itemKey = getItemKey(item.menuItem, item.selectedSize, item.selectedIngredients, item.selectedExtras, item.selectedPastaType, item.selectedSauce, item.selectedSpecialRequest);
              const searchKey = getItemKey({ id } as MenuItem, selectedSize, selectedIngredients, selectedExtras, selectedPastaType, selectedSauce, selectedSpecialRequest);
              return itemKey === searchKey ? { ...item, quantity } : item;
            })
          };
        }),

      clearCart: () => set({ items: [] }),
      
      resetStore: () => set({ items: [] })
    }),
    { name: 'cart-storage' }
  )
);