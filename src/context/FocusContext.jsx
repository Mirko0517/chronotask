import { createContext, useContext, useState } from 'react';

const FocusContext = createContext();

export function FocusProvider({ children }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <FocusContext.Provider value={{ isFocused, setIsFocused }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  return useContext(FocusContext);
} 