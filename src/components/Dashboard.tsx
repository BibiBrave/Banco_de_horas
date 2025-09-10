import React from 'react';
import { Clock, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { TimeBankSummary } from '../types/timebank';
import { formatHours } from '../utils/timeCalculations';

interface DashboardProps {
  summary: TimeBankSummary;
}

export const Dashboard: React.FC<DashboardProps> = ({ summary }) => {
  const { totalBalance, totalWorkedHours, totalContractualHours, averageWorkedHours, daysWorked } = summary;
  
  const balanceColor = totalBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const balanceIcon = totalBalance >= 0 ? TrendingUp : TrendingDown;
  const BalanceIcon = balanceIcon;

  const stats = [
    {
      label: 'Saldo Total',
      value: formatHours(totalBalance),
      icon: BalanceIcon,
      color: totalBalance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
      textColor: balanceColor,
    },
    {
      label: 'Horas Trabalhadas',
      value: formatHours(totalWorkedHours),
      icon: Clock,
      color: 'bg-blue-100 text-blue-600',
      textColor: 'text-gray-900',
    },
    {
      label: 'Horas Contratuais',
      value: formatHours(totalContractualHours),
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
      textColor: 'text-gray-900',
    },
    {
      label: 'Média Diária',
      value: formatHours(averageWorkedHours),
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
      textColor: 'text-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              {index === 0 && daysWorked > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {daysWorked} dia{daysWorked !== 1 ? 's' : ''} trabalhado{daysWorked !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};