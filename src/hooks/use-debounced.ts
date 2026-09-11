"use client";

import { useEffect, useState } from "react";

/**
 * Valeur retardée : suit `value`, mais seulement une fois qu'elle a cessé de
 * changer pendant `delay` millisecondes.
 *
 * Sert aux champs de recherche : sans elle, chaque frappe déclencherait une
 * requête, et les réponses pourraient arriver dans le désordre.
 */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
