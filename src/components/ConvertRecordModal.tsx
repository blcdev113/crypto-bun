import React, { useState } from 'react';
import { X, ArrowRightLeft, Calendar, Filter } from 'lucide-react';
import { cryptoLogos } from '../utils/cryptoLogos';
import { formatCurrency } from '../utils/formatters';
import { usePositions } from '../context/PositionContext';

interface ConvertRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const ConvertRecordModal: React.FC<ConvertRecordModalProps> = ({ isOpen, onClose }) => {
  const { conversionHistory } = usePositions();
  const [filterToken, setFilterToken] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredRecords = conversionHistory.filter(record => {
    if (filterToken !== 'all' && record.fromToken !== filterToken && record.toToken !== filterToken) {
      return false;
    }
    
    if (dateFilter !== 'all') {
      const recordDate = new Date(record.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case '7d':
          return daysDiff <= 7;
        case '30d':
          return daysDiff <= 30;
        case '90d':
          return daysDiff <= 90;
        default:
          return true;
      }
    }
    
    return true;
  });

  const getTokenLogo = (symbol: string) => {
    return cryptoLogos[symbol] || null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#22C55E]';
      case 'pending':
        return 'text-[#F59E0B]';
      case 'failed':
        return 'text-[#EF4444]';
      default:
        return 'text-gray-400';
    }
  };

  const uniqueTokens = Array.from(new Set([
    ...conversionHistory.map(r => r.fromToken),
    ...conversionHistory.map(r => r.toToken)
  ])).sort();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E293B] rounded-lg w-full max-w-4xl h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Convert Record</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterToken}
                onChange={(e) => setFilterToken(e.target.value)}
                className="bg-[#2D3748] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                <option value="all">All Tokens</option>
                {uniqueTokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-[#2D3748] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const fromLogo = getTokenLogo(record.fromToken);
                const toLogo = getTokenLogo(record.toToken);

                return (
                  <div key={record.id} className="bg-[#2D3748] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      {/* Conversion Details */}
                      <div className="flex items-center space-x-4">
                        {/* From Token */}
                        <div className="flex items-center space-x-2">
                          {fromLogo ? (
                            <img src={fromLogo} alt={record.fromToken} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white">
                              {record.fromToken[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{record.fromAmount.toFixed(8)} {record.fromToken}</div>
                            <div className="text-sm text-gray-400">From</div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRightLeft size={20} className="text-[#22C55E]" />

                        {/* To Token */}
                        <div className="flex items-center space-x-2">
                          {toLogo ? (
                            <img src={toLogo} alt={record.toToken} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white">
                              {record.toToken[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{record.toAmount.toFixed(8)} {record.toToken}</div>
                            <div className="text-sm text-gray-400">To</div>
                          </div>
                        </div>
                      </div>

                      {/* Rate and Status */}
                      <div className="text-right">
                        <div className="font-medium">
                          Rate: {record.rate.toLocaleString()} {record.toToken}/{record.fromToken}
                        </div>
                        <div className="text-sm text-gray-400 mb-1">
                          {formatDate(record.timestamp)}
                        </div>
                        <div className={`text-sm font-medium capitalize ${getStatusColor(record.status)}`}>
                          {record.status}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Transaction ID:</span>
                          <div className="font-mono text-xs">{record.id.padStart(16, '0')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Fee:</span>
                          <div className="text-[#22C55E]">Free</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <div>Instant Convert</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-[#2D3748] rounded-full flex items-center justify-center mb-4">
                <ArrowRightLeft size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Convert Records</h3>
              <p className="text-gray-400 mb-4">
                {filterToken !== 'all' || dateFilter !== 'all' 
                  ? 'No conversions found for the selected filters.'
                  : 'You haven\'t made any conversions yet. Use the Convert feature to exchange between cryptocurrencies.'
                }
              </p>
              {filterToken !== 'all' || dateFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setFilterToken('all');
                    setDateFilter('all');
                  }}
                  className="text-[#22C55E] hover:text-[#16A34A]"
                >
                  Clear Filters
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredRecords.length > 0 && (
          <div className="p-6 border-t border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-400">
                Showing {filteredRecords.length} of {conversionHistory.length} conversions
              </div>
              <div className="text-gray-400">
                Total conversions: {conversionHistory.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvertRecordModal;