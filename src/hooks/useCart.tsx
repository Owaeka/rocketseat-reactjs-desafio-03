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
    console.log("storagedCart: " + JSON.parse(storagedCart));
    return JSON.parse(storagedCart);
  }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);
      const currentAmount = productExists ? productExists.amount : 0;
      const stock: Stock = await api.get(`/stock/${productId}`).then(response => response.data);

      if(!stock) return; 

      if(stock.amount <= currentAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      if(productExists) {
        productExists.amount += 1;
      } else {
        const product: Product = await api.get(`/products/${productId}`).then(response => response.data);
        const newProduct = {
          ...product,
          amount: 1,
        }
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      /*await api.put(`/stock/${productId}`, {
        id: stock.id,
        amount: stock.amount - 1,
      })*/

    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const deletingProductIndex = updatedCart.findIndex(product => product.id === productId);
      
      if(deletingProductIndex >= 0) {
        updatedCart.splice(deletingProductIndex, 1)
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw new Error();
      }

      
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) {
        throw new Error();
      }
      const updatedCart = [...cart];
      const stock: Stock = await api.get(`/stock/${productId}`).then(response => response.data);
      const updatingProduct = updatedCart.find(product => product.id === productId);

      if(!updatingProduct) return;
      
      if(stock.amount <= amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      updatingProduct.amount = amount;

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
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
