import { useState } from 'react';

interface Table {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  isPrivate: boolean;
}

interface TableCardProps {
  table: Table;
}

const TableCard = ({ table }: TableCardProps) => {
  const [isJoining, setIsJoining] = useState(false);

  const formatChips = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  };

  const handleJoinTable = async () => {
    setIsJoining(true);
    // Simulate joining table
    setTimeout(() => {
      setIsJoining(false);
      // In real app, navigate to game page
      console.log(`Joining table ${table.id}`);
    }, 1000);
  };

  const getTableStatus = () => {
    if (table.currentPlayers === table.maxPlayers) {
      return { text: 'Penuh', color: 'text-red-600 bg-red-100' };
    } else if (table.currentPlayers >= table.maxPlayers * 0.8) {
      return { text: 'Hampir Penuh', color: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { text: 'Tersedia', color: 'text-green-600 bg-green-100' };
    }
  };

  const status = getTableStatus();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            {table.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
            {table.isPrivate && (
              <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                🔒 Private
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {table.currentPlayers}/{table.maxPlayers}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Pemain
          </div>
        </div>
      </div>

      {/* Table Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Min Bet:</span>
          <span className="font-medium text-gray-800 dark:text-white">
            💰 {formatChips(table.minBet)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Max Bet:</span>
          <span className="font-medium text-gray-800 dark:text-white">
            💰 {formatChips(table.maxBet)}
          </span>
        </div>
      </div>

      {/* Players indicator */}
      <div className="flex items-center mb-4">
        <div className="flex -space-x-2">
          {Array.from({ length: Math.min(table.currentPlayers, 4) }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold"
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          {table.currentPlayers > 4 && (
            <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold">
              +{table.currentPlayers - 4}
            </div>
          )}
        </div>
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
          {table.currentPlayers === 0 ? 'Belum ada pemain' : 
           table.currentPlayers === 1 ? '1 pemain menunggu' :
           `${table.currentPlayers} pemain aktif`}
        </span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleJoinTable}
        disabled={table.currentPlayers === table.maxPlayers || isJoining}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          table.currentPlayers === table.maxPlayers
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : isJoining
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isJoining ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Bergabung...</span>
          </div>
        ) : table.currentPlayers === table.maxPlayers ? (
          'Meja Penuh'
        ) : (
          'Bergabung ke Meja'
        )}
      </button>
    </div>
  );
};

export default TableCard;
