import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Add item or increase quantity — matches by id AND selectedSize
  function addToCart(product) {
    const size = product.selectedSize || "";
    setCartItems((prev) => {
      const exists = prev.find(
        (item) => item.id === product.id && (item.selectedSize || "") === size
      );
      if (exists) {
        return prev.map((item) =>
          item.id === product.id && (item.selectedSize || "") === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, selectedSize: size, quantity: 1 }];
    });
  }

  // Decrease quantity or remove if qty reaches 0 — needs size to target the right line
  function removeFromCart(productId, selectedSize = "") {
    setCartItems((prev) => {
      const exists = prev.find(
        (item) => item.id === productId && (item.selectedSize || "") === selectedSize
      );
      if (exists && exists.quantity > 1) {
        return prev.map((item) =>
          item.id === productId && (item.selectedSize || "") === selectedSize
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(
        (item) => !(item.id === productId && (item.selectedSize || "") === selectedSize)
      );
    });
  }

  // Remove item completely regardless of quantity — also size-aware
  function deleteFromCart(productId, selectedSize = "") {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.id === productId && (item.selectedSize || "") === selectedSize)
      )
    );
  }

  // Clear entire cart (used after order placed)
  function clearCart() {
    setCartItems([]);
  }

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, deleteFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

