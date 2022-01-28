import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let editableCart = cart;
      const productStock: Stock = await (await api.get(`stock/${productId}`)).data;
      const productData = await (await api.get(`products/${productId}`)).data;
      const productExistsInCart = editableCart.findIndex(product => product.id === productId);

      if (productExistsInCart < 0) {
        if (productStock.amount > 0) {
          editableCart.push({
            ...productData,
            amount: 1
          })
          setCart([...editableCart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(editableCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        if (productStock.amount > editableCart[productExistsInCart].amount) {
          editableCart[productExistsInCart] = {
            ...editableCart[productExistsInCart],
            amount: editableCart[productExistsInCart].amount + 1
          }
          setCart([...editableCart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(editableCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let editableCart = cart;
      const productExistsInCart = editableCart.findIndex(product => product.id === productId);

      if (productExistsInCart >= 0) {
        editableCart.splice(productExistsInCart, 1);
        setCart([...editableCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(editableCart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch { 
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let editableCart = cart;
      const productStock: Stock = await (await api.get(`stock/${productId}`)).data;
      const productExistsInCart = editableCart.findIndex(product => product.id === productId);

      if (productExistsInCart < 0) {
        toast.error('Erro na alteração de quantidade do produto');
      } else {
        if (amount > productStock.amount || amount <= 0) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          editableCart[productExistsInCart] = {
            ...editableCart[productExistsInCart],
            amount
          }
          setCart([...editableCart]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(editableCart));
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}