import { useState, useEffect, useCallback } from 'react';
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

export function useStats({ apiKey, range }: UseStatsOptions): UseStatsResult {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!apiKey) {
      setError('No API key configured');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${API_VERSION}/stats?range=${range}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const stats = await response.json() as StatsResponse;
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiKey, range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
