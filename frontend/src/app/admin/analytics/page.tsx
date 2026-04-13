'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Summary, Affiliate, AnalyticsClick } from '../shared';
import { formatCurrency } from '../shared';
import { useTranslation } from '@/hooks/useTranslation';
import { StatCard } from '@/components/StatCard';
interface DeviceMetric {
  name: string;
  count: number;
  percentage?: number;
}

interface GeoMetric {
  region: string;
  count: number;
  percentage?: number;
}

interface TrafficSource {
  source: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [clickStats, setClickStats] = useState<AnalyticsClick[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceMetric[]>([]);
  const [geoData, setGeoData] = useState<GeoMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'custom'>('7days');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      try {
        const [summaryRes, affiliatesRes, clicksRes, devicesRes, geoRes, sourcesRes] = await Promise.all([
          api.get(`/admin/summary?days=${days}`),
          api.get(`/admin/affiliates?days=${days}`),
          api.get(`/admin/clicks?days=${days}`),
          api.get(`/admin/analytics/devices?days=${days}`),
          api.get(`/admin/analytics/geo?days=${days}`),
          api.get(`/admin/analytics/traffic-sources?days=${days}`),
        ]);

        setSummary(summaryRes.data);
        setAffiliates(affiliatesRes.data);
        setClickStats(clicksRes.data);
        
        // Calculate device percentages
        const devices = devicesRes.data.map((item: DeviceMetric) => ({
          ...item,
          count: Number(item.count) || 0,
        }));
        const totalDevices = devices.reduce((sum: number, d: DeviceMetric) => sum + d.count, 0);
        const devicesWithPercentage = devices.map((d: DeviceMetric) => ({
          ...d,
          percentage: totalDevices > 0 ? ((d.count / totalDevices) * 100).toFixed(1) : 0,
        }));
        setDeviceData(devicesWithPercentage);
        
        // Calculate geo percentages
        const geo = geoRes.data.map((item: GeoMetric) => ({
          ...item,
          count: Number(item.count) || 0,
        }));
        const totalGeo = geo.reduce((sum: number, g: GeoMetric) => sum + g.count, 0);
        const geoWithPercentage = geo.map((g: GeoMetric) => ({
          ...g,
          percentage: totalGeo > 0 ? ((g.count / totalGeo) * 100).toFixed(1) : 0,
        }));
        setGeoData(geoWithPercentage);
        
        setTrafficSources(sourcesRes.data.map((item: TrafficSource) => ({
          ...item,
          count: Number(item.count) || 0,
        })));
      } catch (err) {
        console.error('Error fetching analytics data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const exportCSV = async () => {
    try {
      const { data } = await api.get('/admin/export');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiliates-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Export error', err);
    }
  };

  const deviceColors: Record<string, string> = {
    Mobile: '#050C9C',
    Desktop: '#3B82F6',
    Tablet: '#93C5FD',
    Other: '#E5E7EB',
  };

  const chartDeviceData = deviceData.map((item) => ({
    ...item,
    color: deviceColors[item.name] || deviceColors.Other,
  }));

  const activeGeoData = geoData.length > 0 ? geoData : [{ region: 'No data', count: 0, percentage: 0 }];
  const sourceChartData = trafficSources.length > 0 ? trafficSources : [{ source: 'No data', count: 0 }];

  const totalRevenue = summary?.total_revenue || 0;
  const totalConversions = summary?.total_sales || 0;
  const totalClicks = summary?.total_clicks || 0;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';
  const avgOrderValue = totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : '0.00';

  const topAffiliates = affiliates
    .sort((a: Affiliate, b: Affiliate) => (b.total_earnings || 0) - (a.total_earnings || 0))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#050C9C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#191C1E]">{t('analytics.title')}</h1>
          <p className="text-sm text-[#505F76] mt-1">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button 
              onClick={() => setDateRange('7days')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '7days' 
                  ? 'bg-white text-[#050C9C] shadow-sm' 
                  : 'text-[#505F76] hover:text-gray-700'
              }`}
            >
              {t('common.last7Days')}
            </button>
            <button 
              onClick={() => setDateRange('30days')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '30days' 
                  ? 'bg-white text-[#050C9C] shadow-sm' 
                  : 'text-[#505F76] hover:text-gray-700'
              }`}
            >
              30 {t('common.days')}
            </button>
            <button 
              onClick={() => setDateRange('custom')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                dateRange === 'custom' 
                  ? 'bg-white text-[#050C9C] shadow-sm' 
                  : 'text-[#505F76] hover:text-gray-700'
              }`}
            >
              {t('common.custom')}
            </button>
          </div>
          <button 
            onClick={exportCSV}
            className="px-5 py-2.5 bg-[#050C9C] hover:bg-[#040a7a] text-white rounded-lg font-semibold text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('common.export')} CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
           icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16H2ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10C8 9.45 7.80417 8.97917 7.4125 8.5875C7.02083 8.19583 6.55 8 6 8V10H8ZM18 10H20V8C19.45 8 18.9792 8.19583 18.5875 8.5875C18.1958 8.97917 18 9.45 18 10ZM13 9C13.8333 9 14.5417 8.70833 15.125 8.125C15.7083 7.54167 16 6.83333 16 6C16 5.16667 15.7083 4.45833 15.125 3.875C14.5417 3.29167 13.8333 3 13 3C12.1667 3 11.4583 3.29167 10.875 3.875C10.2917 4.45833 10 5.16667 10 6C10 6.83333 10.2917 7.54167 10.875 8.125C11.4583 8.70833 12.1667 9 13 9ZM6 4C6.55 4 7.02083 3.80417 7.4125 3.4125C7.80417 3.02083 8 2.55 8 2H6V4ZM20 4V2H18C18 2.55 18.1958 3.02083 18.5875 3.4125C18.9792 3.80417 19.45 4 20 4Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#E3DFFF"
          label={t('stats.totalRevenue').toUpperCase()}
          value={`$${totalRevenue.toLocaleString()}`}
          change={summary?.total_revenue_trend || '+0%'}
          isPositive={(summary?.total_revenue_trend || '+0%').startsWith('+')}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.625 13.025L0 11.85L5 3.85L8 7.35L12 0.85L15 5.35L18.375 0L20 1.175L15.05 9.025L12.075 4.55L8.275 10.725L5.25 7.2L1.625 13.025ZM13.5 17C14.2 17 14.7917 16.7583 15.275 16.275C15.7583 15.7917 16 15.2 16 14.5C16 13.8 15.7583 13.2083 15.275 12.725C14.7917 12.2417 14.2 12 13.5 12C12.8 12 12.2083 12.2417 11.725 12.725C11.2417 13.2083 11 13.8 11 14.5C11 15.2 11.2417 15.7917 11.725 16.275C12.2083 16.7583 12.8 17 13.5 17ZM18.6 21L15.9 18.3C15.55 18.5333 15.1708 18.7083 14.7625 18.825C14.3542 18.9417 13.9333 19 13.5 19C12.25 19 11.1875 18.5625 10.3125 17.6875C9.4375 16.8125 9 15.75 9 14.5C9 13.25 9.4375 12.1875 10.3125 11.3125C11.1875 10.4375 12.25 10 13.5 10C14.75 10 15.8125 10.4375 16.6875 11.3125C17.5625 12.1875 18 13.25 18 14.5C18 14.9333 17.9417 15.3542 17.825 15.7625C17.7083 16.1708 17.5333 16.55 17.3 16.9L20 19.6L18.6 21Z" fill="#EA580C"/>
</svg>
}
          iconBgColor="#FFF7ED"
          label={t('stats.totalConversions').toUpperCase()}
          value={totalConversions.toLocaleString()}
          change={summary?.total_sales_trend || '+0%'}
          isPositive={(summary?.total_sales_trend || '+0%').startsWith('+')}
          backgroundSvg={undefined}
        />
        <StatCard
              icon={<svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.625 13.025L0 11.85L5 3.85L8 7.35L12 0.85L15 5.35L18.375 0L20 1.175L15.05 9.025L12.075 4.55L8.275 10.725L5.25 7.2L1.625 13.025ZM13.5 17C14.2 17 14.7917 16.7583 15.275 16.275C15.7583 15.7917 16 15.2 16 14.5C16 13.8 15.7583 13.2083 15.275 12.725C14.7917 12.2417 14.2 12 13.5 12C12.8 12 12.2083 12.2417 11.725 12.725C11.2417 13.2083 11 13.8 11 14.5C11 15.2 11.2417 15.7917 11.725 16.275C12.2083 16.7583 12.8 17 13.5 17ZM18.6 21L15.9 18.3C15.55 18.5333 15.1708 18.7083 14.7625 18.825C14.3542 18.9417 13.9333 19 13.5 19C12.25 19 11.1875 18.5625 10.3125 17.6875C9.4375 16.8125 9 15.75 9 14.5C9 13.25 9.4375 12.1875 10.3125 11.3125C11.1875 10.4375 12.25 10 13.5 10C14.75 10 15.8125 10.4375 16.6875 11.3125C17.5625 12.1875 18 13.25 18 14.5C18 14.9333 17.9417 15.3542 17.825 15.7625C17.7083 16.1708 17.5333 16.55 17.3 16.9L20 19.6L18.6 21Z" fill="#EA580C"/>
</svg>
}
          iconBgColor="#FFF7ED"
          label={t('analytics.conversionRate').toUpperCase()}
          value={`${conversionRate}%`}
          change=""
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V3H2V14H19V16H2ZM6 12C5.45 12 4.97917 11.8042 4.5875 11.4125C4.19583 11.0208 4 10.55 4 10V2C4 1.45 4.19583 0.979167 4.5875 0.5875C4.97917 0.195833 5.45 0 6 0H20C20.55 0 21.0208 0.195833 21.4125 0.5875C21.8042 0.979167 22 1.45 22 2V10C22 10.55 21.8042 11.0208 21.4125 11.4125C21.0208 11.8042 20.55 12 20 12H6ZM8 10C8 9.45 7.80417 8.97917 7.4125 8.5875C7.02083 8.19583 6.55 8 6 8V10H8ZM18 10H20V8C19.45 8 18.9792 8.19583 18.5875 8.5875C18.1958 8.97917 18 9.45 18 10ZM13 9C13.8333 9 14.5417 8.70833 15.125 8.125C15.7083 7.54167 16 6.83333 16 6C16 5.16667 15.7083 4.45833 15.125 3.875C14.5417 3.29167 13.8333 3 13 3C12.1667 3 11.4583 3.29167 10.875 3.875C10.2917 4.45833 10 5.16667 10 6C10 6.83333 10.2917 7.54167 10.875 8.125C11.4583 8.70833 12.1667 9 13 9ZM6 4C6.55 4 7.02083 3.80417 7.4125 3.4125C7.80417 3.02083 8 2.55 8 2H6V4ZM20 4V2H18C18 2.55 18.1958 3.02083 18.5875 3.4125C18.9792 3.80417 19.45 4 20 4Z" fill="#050C9C"/>
</svg>
}
          iconBgColor="#E3DFFF"
          label={t('analytics.avgOrderValue').toUpperCase()}
          value={`$${avgOrderValue}`}
          change=""
          isPositive={true}
          backgroundSvg={undefined}
        />
      </div>

      {/* 2-Column Layout: Left (2/3) and Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Performance */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#191C1E]">{t('admin.revenuePerformance')}</h3>
                <p className="text-sm text-[#505F76]">{t('analytics.historicalTrend')}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#050C9C] rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">{t('analytics.revenue')}</span>
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clickStats.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#050C9C" radius={[8, 8, 0, 0]} name={t('analytics.clicks')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Affiliate Performance */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#191C1E] mb-2">{t('analytics.affiliatePerformance')}</h3>
            <p className="text-sm text-[#505F76] mb-6">{t('analytics.topPartnersRanked')}</p>
            
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-[#505F76] uppercase pb-3 ">
                <div>{t('admin.affiliate')}</div>
                <div className="text-center">{t('analytics.clicks')}</div>
                <div className="text-center">{t('admin.conversions')}</div>
                <div className="text-center">{t('admin.revenue')}</div>
                <div className="text-center">{t('common.cvr')}</div>
              </div>
              
              {topAffiliates.map((aff: Affiliate) => {
                const clicks = aff.clicks_count || 0;
                const conversions = aff.sales_count || 0;
                const cvr = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0.00';
                
                return (
                  <AffiliateRow 
                    key={aff.id}
                    name={aff.user.name} 
                    clicks={clicks.toLocaleString()} 
                    conversions={conversions.toString()} 
                    revenue={`${formatCurrency(aff.total_earnings)}`} 
                    cvr={`${cvr}%`} 
                  />
                );
              })}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#191C1E] mb-2">{t('analytics.trafficSources')}</h3>
            <p className="text-sm text-[#505F76] mb-6">{t('analytics.clickVolumeByChannel')}</p>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="source" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#050C9C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Smart Insights */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19ZM8 14.15L9 12L11.15 11L9 10L8 7.85L7 10L4.85 11L7 12L8 14.15Z" fill="#050C9C"/>
              </svg>
              <h3 className="text-lg font-bold text-[#191C1E]">{t('analytics.smartInsights')}</h3>
            </div>
            
            <div className="space-y-4">
              <InsightItem 
                icon={<svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.816667 7L0 6.18333L4.31667 1.8375L6.65 4.17083L9.68333 1.16667H8.16667V0H11.6667V3.5H10.5V1.98333L6.65 5.83333L4.31667 3.5L0.816667 7Z" fill="#16A34A"/>
                </svg>}
                text={t('analytics.revenueIncreased', { rate: summary?.total_revenue_trend || '0%' })}
                subtext={t('analytics.affiliateCampaigns')}
              />
              <InsightItem 
                icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.99583 8.64792L5.83333 7.53958L7.67083 8.6625L7.18958 6.5625L8.80833 5.1625L6.67917 4.97292L5.83333 2.98958L4.9875 4.95833L2.85833 5.14792L4.47708 6.5625L3.99583 8.64792ZM2.23125 11.0833L3.17917 6.98542L0 4.22917L4.2 3.86458L5.83333 0L7.46667 3.86458L11.6667 4.22917L8.4875 6.98542L9.43542 11.0833L5.83333 8.91042L2.23125 11.0833Z" fill="#050C9C"/>
                </svg>}
                text={t('analytics.topAffiliatesGenerate', { percent: affiliates.length > 0 ? Math.round((topAffiliates.length / affiliates.length) * 100) : 0 })}
                subtext={t('analytics.diversifyBase')}
              />
              <InsightItem 
                icon={<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 11.0833L6.41667 0L12.8333 11.0833H0ZM2.0125 9.91667H10.8208L6.41667 2.33333L2.0125 9.91667ZM6.41667 9.33333C6.58194 9.33333 6.72049 9.27743 6.83229 9.16562C6.9441 9.05382 7 8.91528 7 8.75C7 8.58472 6.9441 8.44618 6.83229 8.33438C6.72049 8.22257 6.58194 8.16667 6.41667 8.16667C6.25139 8.16667 6.11285 8.22257 6.00104 8.33438C5.88924 8.44618 5.83333 8.58472 5.83333 8.75C5.83333 8.91528 5.88924 9.05382 6.00104 9.16562C6.11285 9.27743 6.25139 9.33333 6.41667 9.33333ZM5.83333 7.58333H7V4.66667H5.83333V7.58333Z" fill="#DC2626"/>
                </svg>}
                text={t('analytics.conversionDropped', { rate: summary?.total_sales_trend || '0%' })}
                subtext={t('analytics.mobileCheckoutFriction')}
              />
            </div>
          </div>

          {/* Geographic Insights */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#191C1E] mb-2">{t('analytics.geographicInsights')}</h3>
            <p className="text-sm text-[#505F76] mb-6">{t('analytics.revenueDistribution')}</p>
            
            <div className="bg-gray-100 rounded-xl h-64 mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-1/4 start-1/2 w-4 h-4 bg-[#050C9C] rounded-full"></div>
              <div className="absolute bottom-1/3 start-1/3 w-4 h-4 bg-[#3B82F6] rounded-full"></div>
              <div className="absolute top-1/3 end-1/4 w-4 h-4 bg-[#050C9C] rounded-full"></div>
            </div>

            <div className="space-y-4">
              {activeGeoData.slice(0, 3).map((item, idx) => {
                const colors = ['#050C9C', '#3B82F6', '#93C5FD'];
                const percentage = item.percentage || 0;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }}></div>
                        <span className="text-sm font-medium text-gray-700">{item.region}</span>
                      </div>
                      <span className="text-sm font-bold text-[#191C1E]">${item.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colors[idx]
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-[#191C1E] mb-2">{t('analytics.deviceDistribution')}</h3>
            <p className="text-sm text-[#505F76] mb-6">{t('analytics.userTrafficByDevice')}</p>
            
            <div className="flex items-center justify-center h-48 mb-6">
              <div className="relative w-48 h-48">
                {chartDeviceData.map((device, idx) => {
                  const rotation = idx * 90;
                  return (
                    <div
                      key={idx}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(${device.color} 0deg ${rotation}deg, transparent ${rotation}deg)`,
                      }}
                    />
                  );
                })}
                <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#191C1E]">100%</p>
                    <p className="text-xs text-[#505F76]">{t('analytics.total')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {chartDeviceData.map((device, idx) => (
                <div key={idx} className="flex flex-wrap items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }}></div>
                    <span className="text-sm font-medium text-gray-700">{device.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#191C1E]">{device.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, isPositive }: { label: string; value: string; change: string; isPositive: boolean }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <p className="text-xs font-semibold text-[#505F76] uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-[#191C1E]">{value}</p>
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function InsightItem({ icon, text, subtext }: { icon: React.ReactNode; text: string; subtext: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#191C1E]">{text}</p>
        <p className="text-xs text-[#505F76] mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function AffiliateRow({ name, clicks, conversions, revenue, cvr }: { name: string; clicks: string; conversions: string; revenue: string; cvr: string }) {
  return (
    <div className="grid grid-cols-5 gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">{name.charAt(0)}</span>
        </div>
        <span className="text-sm font-medium text-[#191C1E] truncate">{name}</span>
      </div>
      <div className="text-center text-sm text-gray-600 flex items-center justify-center">{clicks}</div>
      <div className="text-center text-sm text-gray-600 flex items-center justify-center">{conversions}</div>
      <div className="text-center text-sm font-semibold text-[#191C1E] flex items-center justify-center">{revenue}</div>
      <div className="text-center text-sm font-bold text-[#050C9C] flex items-center justify-center">{cvr}</div>
    </div>
  );
}
