import useSWR from 'swr';
import { axiosInstance } from '../lib/axios';
import { useEffect, useState } from 'react';

export function useGet<T>(url: string | null, options = {}) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const { data, error, isValidating, mutate } = useSWR<T>(
    url,
    async (url: string) => {
      if (!token) {
        throw new Error('UnAuthorized');
      }
      const response = await axiosInstance.get<T>(url, options);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      setToken(newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (token && !data) {
      mutate();
    }
  }, [token, data, mutate]);

  const loading = !error && !data && isValidating;

  return {
    data,
    error,
    isValidating,
    mutate,
    loading,
    isAuthenticated: !!token
  };
}