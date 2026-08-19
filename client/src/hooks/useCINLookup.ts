import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';

export interface CompanySuggestion {
  cin: string;
  name: string;
}

export interface CINFilingDoc {
  ref_key: string;
  formId: string;
  fileName: string;
  year: string;
  dateOfFiling: string;
  documentCategory: string;
  numberOfPages: string;
  fileSize: string;
  fileType: string;
}

export function useCINLookup() {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCompanies = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/mca/company/search?q=${encodeURIComponent(query)}`);
        setSuggestions(data.data ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const lookupCIN = useCallback(async (cin: string): Promise<CompanySuggestion | null> => {
    if (!cin || cin.trim().length < 10) return null;
    setLookingUp(true);
    try {
      const { data } = await api.get(`/mca/company/${encodeURIComponent(cin.trim().toUpperCase())}`);
      return data.data ?? null;
    } catch {
      return null;
    } finally {
      setLookingUp(false);
    }
  }, []);

  const getFilings = useCallback(async (cin: string): Promise<CINFilingDoc[]> => {
    try {
      const { data } = await api.get(`/mca/company/${encodeURIComponent(cin.trim().toUpperCase())}/filings`);
      return data.data?.docs ?? [];
    } catch {
      return [];
    }
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, searching, lookingUp, searchCompanies, lookupCIN, getFilings, clearSuggestions };
}
