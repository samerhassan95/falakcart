'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Download, TrendingUp, TrendingDown, CheckCircle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Summary, Affiliate, AnalyticsClick } from '../shared';
import { formatCurrency } from '../shared';
import { StatCard } from '@/components/StatCard';

interface DeviceMetric {
  name: string;
  count: number;
}

interface GeoMetric {
  region: string;
  count: number;
}

interface TrafficSource {
  source: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [clickStats, setClickStats] = useState<AnalyticsClick[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceMetric[]>([]);
  const [geoData, setGeoData] = useState<GeoMetric[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, affiliatesRes, clicksRes, devicesRes, geoRes, sourcesRes] = await Promise.all([
          api.get('/admin/summary'),
          api.get('/admin/affiliates'),
          api.get('/admin/clicks?days=30'),
          api.get('/admin/analytics/devices?days=30'),
          api.get('/admin/analytics/geo?days=30'),
          api.get('/admin/analytics/traffic-sources?days=30'),
        ]);

        setSummary(summaryRes.data);
        setAffiliates(affiliatesRes.data);
        setClickStats(clicksRes.data);
        setDeviceData(devicesRes.data.map((item: DeviceMetric) => ({
          ...item,
          count: Number(item.count) || 0,
        })));
        setGeoData(geoRes.data.map((item: GeoMetric) => ({
          ...item,
          count: Number(item.count) || 0,
        })));
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
  }, []);

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
    Mobile: '#4F46E5',
    Desktop: '#818CF8',
    Tablet: '#C7D2FE',
    Other: '#A3AED0',
  };

  const chartDeviceData = deviceData.map((item) => ({
    ...item,
    color: deviceColors[item.name] || deviceColors.Other,
  }));

  const activeGeoData = geoData.length > 0 ? geoData : [{ region: 'No data', count: 0 }];
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
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191C1E]">Reports</h1>
          <p className="text-sm text-[#505F76]">Analyze platform performance and affiliate insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-[#FFFFFFCC] backdrop-blur-md border border-gray-200 rounded-lg text-sm font-medium">
            <option>Last 7 days</option>
            <option>30 days</option>
            <option>Custom</option>
          </select>
          <button 
            onClick={exportCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-[#050C9C] text-white rounded-lg font-semibold text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<svg className="w-5 h-5 text-[#050C9C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          iconBgColor="#E0E7FF"
          label="TOTAL REVENUE"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+9%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          iconBgColor="#D1FAE5"
          label="TOTAL CONVERSIONS"
          value={totalConversions.toLocaleString()}
          change="+8%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          iconBgColor="#DBEAFE"
          label="CONVERSION RATE"
          value={`${conversionRate}%`}
          change="+2.4%"
          isPositive={true}
          backgroundSvg={undefined}
        />
        <StatCard
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
          iconBgColor="#EDE9FE"
          label="AVG. ORDER VALUE"
          value={`$${avgOrderValue}`}
          change="+1.2%"
          isPositive={true}
          backgroundSvg={undefined}
        />
      </div>

      {/* Revenue Performance & Smart Insights */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#191C1E]">Revenue Performance</h3>
              <p className="text-sm text-[#505F76]">Historical trend & 6-wk forecasts</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Revenue</span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clickStats.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#050C9C]" />
            <h3 className="text-lg font-bold text-[#191C1E]">Smart Insights</h3>
          </div>
          
          <div className="space-y-4">
            <InsightItem 
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
              text="Revenue increased by 25% this month"
              subtext="Driven by successful affiliate welcome campaigns"
            />
            <InsightItem 
              icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              text="Top affiliates generate 60% of sales"
              subtext="Consider diversifying your affiliate base to mitigate risk"
            />
            <InsightItem 
              icon={<TrendingDown className="w-4 h-4 text-red-600" />}
              text="Conversion rate dropped by 0.5%"
              subtext="Mobile checkout friction detected in the last 48 hours"
            />
          </div>
        </div>
      </div>

      {/* Affiliate Performance & Geographic Insights */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#191C1E] mb-6">Affiliate Performance</h3>
          <p className="text-sm text-[#505F76] mb-4">Top performing partners ranked by revenue</p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-[#505F76] uppercase pb-2 border-b border-gray-100">
              <div>AFFILIATE</div>
              <div className="text-center">CLICKS</div>
              <div className="text-center">CONVERSIONS</div>
              <div className="text-center">REVENUE</div>
              <div className="text-center">CVR</div>
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
                  revenue={`$${formatCurrency(aff.total_earnings)}`} 
                  cvr={`${cvr}%`} 
                />
              );
            })}
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#191C1E] mb-6">Geographic Insights</h3>
          <p className="text-sm text-[#505F76] mb-6">Revenue distribution by region</p>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl h-48 mb-6 flex items-center justify-center relative overflow-hidden">
            <MapPin className="w-16 h-16 text-indigo-300" />
            <div className="absolute top-4 end-4 w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 start-8 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="absolute top-12 end-16 w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
          </div>

          <div className="space-y-3">
            {activeGeoData.map((item, idx) => {
              const bgClass = idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-indigo-400' : idx === 2 ? 'bg-indigo-300' : 'bg-gray-300';
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${bgClass} rounded-full`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.region}</span>
                  </div>
                  <span className="text-sm font-bold text-[#191C1E]">{item.count.toLocaleString()} clicks</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Traffic Sources & Device Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#191C1E] mb-6">Traffic Sources</h3>
          <p className="text-sm text-[#505F76] mb-6">Click volume by referral channel</p>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="source" stroke="#9ca3af" fontSize={11} width={100} />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-[#191C1E] mb-6">Device Distribution</h3>
          <p className="text-sm text-[#505F76] mb-6">User traffic by device type</p>
          
          <div className="space-y-4">
            {chartDeviceData.map((device, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: device.color }}></div>
                  <span className="text-sm font-medium text-gray-700">{device.name}</span>
                </div>
                <span className="text-sm font-bold text-[#191C1E]">{device.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="bg-[#FFFFFFCC] backdrop-blur-md rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold text-[#505F76] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-[#191C1E]">{value}</p>
        <span className="text-xs font-semibold text-green-600">{change}</span>
      </div>
    </div>
  );
}

function InsightItem({ icon, text, subtext }: { icon: React.ReactNode; text: string; subtext: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
    <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">{name.charAt(0)}</span>
        </div>
        <span className="text-sm font-medium text-[#191C1E]">{name}</span>
      </div>
      <div className="text-center text-sm text-gray-600">{clicks}</div>
      <div className="text-center text-sm text-gray-600">{conversions}</div>
      <div className="text-center text-sm font-semibold text-[#191C1E]">{revenue}</div>
      <div className="text-center text-sm font-semibold text-emerald-600">{cvr}</div>
    </div>
  );
}
