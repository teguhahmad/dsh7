import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Calendar,
  User,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import { Account, SalesData, IncentiveRule, IncentiveCalculation, User as UserType } from '../types';

interface IncentiveOverviewProps {
  accounts: Account[];
  salesData: SalesData[];
  incentiveRules: IncentiveRule[];
  currentUser: UserType;
}

const IncentiveOverview: React.FC<IncentiveOverviewProps> = ({ 
  accounts, 
  salesData, 
  incentiveRules,
  currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Sample users data (in real app, this would come from props or API)
  const users: UserType[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@kimostudio.com',
      role: 'user',
      managed_accounts: ['1'],
      created_at: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@kimostudio.com',
      role: 'user',
      managed_accounts: [],
      created_at: '2024-02-01T00:00:00Z',
    },
  ];

  // Get available years from sales data
  const availableYears = useMemo(() => {
    const years = [...new Set(salesData.map(data => new Date(data.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [salesData]);

  // Get available months for selected year
  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];
    
    const months = [...new Set(
      salesData
        .filter(data => new Date(data.date).getFullYear().toString() === selectedYear)
        .map(data => new Date(data.date).getMonth())
    )];
    
    return months.sort((a, b) => a - b);
  }, [salesData, selectedYear]);

  // Filter sales data by period or month/year
  const filteredSalesData = useMemo(() => {
    let filtered = salesData;
    
    // Filter by month/year if selected
    if (selectedMonth && selectedYear) {
      const monthIndex = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      
      filtered = salesData.filter(data => {
        const dataDate = new Date(data.date);
        return dataDate.getMonth() === monthIndex && dataDate.getFullYear() === year;
      });
    } else if (selectedPeriod !== 'all') {
      // Filter by period (days ago)
      const daysAgo = parseInt(selectedPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      filtered = salesData.filter(data => new Date(data.date) >= cutoffDate);
    }
    
    return filtered;
  }, [salesData, selectedPeriod, selectedMonth, selectedYear]);

  // Calculate incentives for all users
  const incentiveCalculations = useMemo(() => {
    return users.map(user => {
      // Get user's managed accounts
      const userAccounts = accounts.filter(account => 
        user.managed_accounts.includes(account.id)
      );

      // Calculate total revenue and commission for user's accounts
      const userSalesData = filteredSalesData.filter(data => 
        user.managed_accounts.includes(data.account_id)
      );

      const totalRevenue = userSalesData.reduce((sum, data) => sum + data.total_purchases, 0);
      const totalCommission = userSalesData.reduce((sum, data) => sum + data.gross_commission, 0);
      const commissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

      // Find applicable incentive rule
      const applicableRule = incentiveRules.find(rule => 
        rule.is_active &&
        totalCommission >= rule.min_commission_threshold &&
        commissionRate >= rule.commission_rate_min &&
        commissionRate <= rule.commission_rate_max
      );

      let incentiveAmount = 0;
      let currentTier = null;
      let nextTier = null;
      let progressPercentage = 0;
      let remainingToNextTier = 0;

      if (applicableRule && totalRevenue >= applicableRule.base_revenue_threshold) {
        // Find current tier
        const sortedTiers = [...applicableRule.tiers].sort((a, b) => a.revenue_threshold - b.revenue_threshold);
        
        for (let i = 0; i < sortedTiers.length; i++) {
          if (totalRevenue >= sortedTiers[i].revenue_threshold) {
            currentTier = sortedTiers[i];
            nextTier = sortedTiers[i + 1] || null;
          }
        }

        if (currentTier) {
          incentiveAmount = (totalRevenue * currentTier.incentive_rate) / 100;
        }

        if (nextTier) {
          progressPercentage = ((totalRevenue - currentTier.revenue_threshold) / 
                              (nextTier.revenue_threshold - currentTier.revenue_threshold)) * 100;
          remainingToNextTier = nextTier.revenue_threshold - totalRevenue;
        } else if (currentTier) {
          progressPercentage = 100;
        }
      }

      return {
        user_id: user.id,
        user_name: user.name,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        commission_rate: commissionRate,
        applicable_rule: applicableRule,
        current_tier: currentTier,
        next_tier: nextTier,
        incentive_amount: incentiveAmount,
        progress_percentage: Math.min(progressPercentage, 100),
        remaining_to_next_tier: remainingToNextTier,
        managed_accounts_count: userAccounts.length,
      } as IncentiveCalculation;
    });
  }, [users, accounts, filteredSalesData, incentiveRules]);

  // Filter calculations by search term
  const filteredCalculations = incentiveCalculations.filter(calc =>
    calc.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalIncentives = filteredCalculations.reduce((sum, calc) => sum + calc.incentive_amount, 0);
    const totalRevenue = filteredCalculations.reduce((sum, calc) => sum + calc.total_revenue, 0);
    const activeUsers = filteredCalculations.filter(calc => calc.managed_accounts_count > 0).length;
    const qualifiedUsers = filteredCalculations.filter(calc => calc.incentive_amount > 0).length;

    return {
      totalIncentives,
      totalRevenue,
      activeUsers,
      qualifiedUsers,
    };
  }, [filteredCalculations]);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      'User Name',
      'Managed Accounts',
      'Total Revenue (IDR)',
      'Total Commission (IDR)',
      'Commission Rate (%)',
      'Incentive Amount (IDR)',
      'Applied Rule',
      'Current Tier Rate (%)',
      'Progress to Next Tier (%)',
      'Remaining to Next Tier (IDR)'
    ];

    const csvData = filteredCalculations.map(calc => [
      calc.user_name,
      calc.managed_accounts_count,
      calc.total_revenue,
      calc.total_commission,
      calc.commission_rate.toFixed(2),
      calc.incentive_amount,
      calc.applicable_rule?.name || 'No Rule Applied',
      calc.current_tier?.incentive_rate || 0,
      calc.progress_percentage.toFixed(1),
      calc.remaining_to_next_tier
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename based on filter
    let filename = 'incentive-overview';
    if (selectedMonth && selectedYear) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      filename += `-${monthNames[parseInt(selectedMonth)]}-${selectedYear}`;
    } else if (selectedPeriod !== 'all') {
      filename += `-last-${selectedPeriod}-days`;
    } else {
      filename += '-all-time';
    }
    filename += `-${new Date().toISOString().split('T')[0]}.csv`;
    
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getMonthName = (monthIndex: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incentive Overview</h1>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-600">Monitor user incentive performance and calculations</p>
            {(selectedMonth && selectedYear) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                <Calendar className="w-4 h-4 mr-1" />
                {getMonthName(parseInt(selectedMonth))} {selectedYear}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalIncentives)}
              </div>
              <p className="text-sm text-gray-600">Total Incentives</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalRevenue)}
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.activeUsers}</div>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.qualifiedUsers}</div>
              <p className="text-sm text-gray-600">Qualified Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Filter Options */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  if (e.target.value !== 'custom') {
                    setSelectedMonth('');
                    setSelectedYear(new Date().getFullYear().toString());
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
                <option value="custom">Custom Month</option>
              </select>
            </div>
            
            {selectedPeriod === 'custom' && (
              <>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedMonth(''); // Reset month when year changes
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Year</option>
                    {availableYears.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>
                </div>
                
                {selectedYear && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Month:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">All Months</option>
                      {availableMonths.map(monthIndex => (
                        <option key={monthIndex} value={monthIndex.toString()}>
                          {getMonthName(monthIndex)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Incentive Details */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">User Incentive Details</h3>
        </div>

        {filteredCalculations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredCalculations.map((calc) => (
              <div key={calc.user_id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{calc.user_name}</h4>
                      <p className="text-sm text-gray-600">
                        {calc.managed_accounts_count} managed accounts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(calc.incentive_amount)}
                    </div>
                    <p className="text-sm text-gray-600">Incentive Amount</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(calc.total_revenue)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Total Commission</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(calc.total_commission)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Commission Rate</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {calc.commission_rate.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {calc.applicable_rule ? (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        Applied Rule: {calc.applicable_rule.name}
                      </span>
                    </div>
                    
                    {calc.current_tier && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700">Current Tier</span>
                          <span className="text-sm font-medium text-purple-900">
                            {calc.current_tier.incentive_rate}% incentive rate
                          </span>
                        </div>
                        
                        {calc.next_tier && (
                          <>
                            <div className="w-full bg-purple-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${calc.progress_percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-purple-700">
                                Progress to next tier: {calc.progress_percentage.toFixed(1)}%
                              </span>
                              <span className="text-purple-700">
                                {formatCurrency(calc.remaining_to_next_tier)} remaining
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">
                        {calc.managed_accounts_count === 0 
                          ? 'No managed accounts'
                          : calc.total_commission < 50000
                          ? 'Below minimum commission threshold'
                          : 'No applicable incentive rule'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncentiveOverview;