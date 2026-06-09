import React, { createContext, useContext, useState, useCallback } from "react";

interface CompareItem {
  hospitalId: number;
  hospitalName: string;
  treatmentId?: number;
}

interface CompareContextValue {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (hospitalId: number) => void;
  clearAll: () => void;
  isInCompare: (hospitalId: number) => boolean;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addItem = useCallback((item: CompareItem) => {
    setItems(prev => {
      if (prev.find(i => i.hospitalId === item.hospitalId)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((hospitalId: number) => {
    setItems(prev => prev.filter(i => i.hospitalId !== hospitalId));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const isInCompare = useCallback((hospitalId: number) => {
    return items.some(i => i.hospitalId === hospitalId);
  }, [items]);

  return (
    <CompareContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearAll,
      isInCompare,
      canAdd: items.length < 3,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
