import useSWR from 'swr';
import { axiosInstance } from '../lib/axios';
import { useEffect } from 'react';

export function useGet<T>(url: string | null, options = {}) {
  const { data, error, isValidating, mutate } = useSWR<T>(
    url,
    async (url: string) => {
      const response = await axiosInstance.get<T>(url, options);
      return response.data;
    },
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !data) {
      mutate();
    }
  }, [localStorage.getItem('token')]);

  return { data, error, isValidating, mutate };
}
