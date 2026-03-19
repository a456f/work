import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Definimos una interfaz básica para el producto compatible con tu sistema
export interface Product {
  id: number;
  title: string;
  price: number;
  cover_image?: string;
  type?: string;
  description?: string;
}

interface FavoritesContextType {
  favorites: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Cargar favoritos del localStorage al iniciar
  useEffect(() => {
    const storedFavorites = localStorage.getItem('myFavorites');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error("Error parsing favorites", e);
      }
    }
  }, []);

  // Guardar en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (product: Product) => {
    setFavorites(prev => {
      if (prev.some(p => p.id === product.id)) return prev; // Evitar duplicados
      return [...prev, product];
    });
  };

  const removeFromFavorites = (productId: number) => {
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };

  const isFavorite = (productId: number) => {
    return favorites.some(p => p.id === productId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      favoritesCount: favorites.length
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};