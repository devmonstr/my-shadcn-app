import { useState, useEffect } from 'react';
import { SystemStats } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useStats() {
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    active_users: 0,
    total_relays: 0,
    active_relays: 0,
    growth_rate: 0,
    user_registration_timeline: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch system stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact' });

      // Fetch active users (users who logged in within last 24 hours)
      const { count: activeUsers } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact' })
        .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Fetch user registration timeline
      const { data: timelineData } = await supabase
        .from('registered_users')
        .select('created_at')
        .order('created_at', { ascending: true });

      // Process timeline data
      const timeline = timelineData?.reduce((acc: { [key: string]: number }, user) => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const userRegistrationTimeline = Object.entries(timeline || {}).map(([date, count]) => ({
        date,
        count
      }));

      // Calculate growth rate
      const lastWeek = userRegistrationTimeline.slice(-7);
      const growthRate = lastWeek.reduce((sum, day) => sum + day.count, 0) / 7;

      setStats({
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_relays: 0, // This would need to be fetched from a relays table
        active_relays: 0, // This would need to be fetched from a relays table
        growth_rate: growthRate,
        user_registration_timeline: userRegistrationTimeline
      });
    } catch (error) {
      setError('Failed to fetch statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(fetchStats, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Get growth rate percentage
  const getGrowthRatePercentage = () => {
    return ((stats.growth_rate / stats.total_users) * 100).toFixed(2);
  };

  // Get user registration trend
  const getUserRegistrationTrend = () => {
    const lastWeek = stats.user_registration_timeline.slice(-7);
    const previousWeek = stats.user_registration_timeline.slice(-14, -7);
    
    const lastWeekTotal = lastWeek.reduce((sum, day) => sum + day.count, 0);
    const previousWeekTotal = previousWeek.reduce((sum, day) => sum + day.count, 0);
    
    return ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
    getGrowthRatePercentage,
    getUserRegistrationTrend
  };
} 