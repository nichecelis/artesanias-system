import { useState, useEffect, useCallback } from 'react';

export function useFetch<T>(key: unknown[], fetcher: () => Promise<T>, options?: { enabled?: boolean }) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (options?.enabled === false) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, options?.enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useMutation<TData, TVariables = void>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsPending(true);
    setIsError(false);
    setError(null);
    try {
      const result = await mutationFn(variables);
      setData(result);
      return result;
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [mutationFn]);

  return {
    mutate,
    mutateAsync: mutate,
    data,
    isPending,
    isError,
    error,
    reset: () => { setData(undefined); setIsError(false); setError(null); },
  };
}
