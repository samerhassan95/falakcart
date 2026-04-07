import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  backgroundSvg: React.ReactNode;
  gradient?: string;
  boxShadow?: string;
  textColor?: string;
  labelColor?: string;
  changeColor?: string;
}

export function StatCard({
  icon,
  iconBgColor,
  label,
  value,
  change,
  isPositive,
  backgroundSvg,
  gradient,
  boxShadow,
  textColor = '#191C1E',
  labelColor = '#9CA3AF',
  changeColor
}: StatCardProps) {
  const cardStyle = gradient
    ? { background: gradient, boxShadow: boxShadow || 'none' }
    : {};

  const baseClass = gradient
    ? 'rounded-2xl p-6 text-white relative overflow-hidden'
    : 'bg-white rounded-2xl p-6 relative overflow-hidden border border-gray-100';

  const finalChangeColor = changeColor || (isPositive ? '#10B981' : '#EF4444');

  return (
    <div className={baseClass} style={cardStyle}>
      {backgroundSvg}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: iconBgColor }}
          >
            {icon}
          </div>
          <span
            className="text-xs font-bold flex items-center gap-1"
            style={{ color: finalChangeColor }}
          >
            <TrendingUp className={`w-3 h-3 ${!isPositive ? 'rotate-180' : ''}`} /> {change}
          </span>
        </div>
        <p
          className="text-xs font-medium uppercase tracking-wider mb-1"
          style={{ color: labelColor }}
        >
          {label}
        </p>
        <p className="text-3xl font-bold" style={{ color: textColor }}>
          {value}
        </p>
      </div>
    </div>
  );
}