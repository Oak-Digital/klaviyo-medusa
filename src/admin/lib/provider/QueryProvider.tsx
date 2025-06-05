import { QueryClientProvider as ReactQueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import queryClient from '../queryClient';

type QueryClientProviderProps = {
  children: ReactNode;
};

const QueryClientProvider = ({ children }: QueryClientProviderProps) => {
  return <ReactQueryClientProvider client={queryClient}>{children}</ReactQueryClientProvider>;
};

export default QueryClientProvider;
