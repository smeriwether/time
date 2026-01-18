import useSWR from 'swr';
import { type StatsResponse, type StatsQuery, API_VERSION } from '@devtime/shared';

interface UseStatsOptions {
  apiKey: string;
  range: StatsQuery['range'];
}

interface UseStatsResult {
  data: StatsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

async function fetchStats([url, apiKey]: [string, string]): Promise<StatsResponse> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<StatsResponse>;
}

export function useStats({ apiKey, range }: UseStatsOptions): UseStatsResult {
  const url = `/api/${API_VERSION}/stats?range=${range}`;

  const { data, error, isLoading, mutate } = useSWR(
    apiKey ? [url, apiKey] : null,
    fetchStats
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error: !apiKey ? 'No API key configured' : (error?.message ?? null),
    refetch: () => mutate(),
  };
}
