import { useState, useEffect } from 'react';

interface UserStatsData {
  totalChips: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  dailyBonusAvailable: boolean;
  streak: number;
}

const UserStats = () => {
  const [stats, setStats] = useState<UserStatsData>({
    totalChips: 5000000,
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    dailyBonusAvailable: true,
    streak: 1,
  });
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);

  const formatChips = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  const claimDailyBonus = async () => {
    setClaimingBonus(true);
    
    // Simulate API call
    setTimeout(() => {
      const bonusAmount = 100000 * stats.streak;
      setStats(prev => ({
        ...prev,
        totalChips: prev.totalChips + bonusAmount,
        dailyBonusAvailable: false,
        streak: prev.streak + 1,
      }));
      setClaimingBonus(false);
      setShowBonusModal(false);
    }, 1500);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Chips */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              💰 {formatChips(stats.totalChips)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Chips
            </div>
          </div>

          {/* Games Played */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.gamesPlayed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Games Played
            </div>
          </div>

          {/* Win Rate */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Win Rate
            </div>
          </div>

          {/* Daily Bonus */}
          <div className="text-center">
            {stats.dailyBonusAvailable ? (
              <button
                onClick={() => setShowBonusModal(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 animate-pulse"
              >
                🎁 Bonus Harian
              </button>
            ) : (
              <div>
                <div className="text-2xl font-bold text-gray-400 mb-1">
                  ✅
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Bonus Claimed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Streak Info */}
        {stats.streak > 1 && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm">
              <span>🔥</span>
              <span>Streak {stats.streak} hari!</span>
            </div>
          </div>
        )}
      </div>

      {/* Daily Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Bonus Harian!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Klaim bonus harian Anda hari ini
              </p>
              
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  💰 {formatChips(100000 * stats.streak)}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Bonus Streak x{stats.streak}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBonusModal(false)}
                  disabled={claimingBonus}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Nanti
                </button>
                <button
                  onClick={claimDailyBonus}
                  disabled={claimingBonus}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-md font-medium transition-all disabled:opacity-50"
                >
                  {claimingBonus ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Claiming...</span>
                    </div>
                  ) : (
                    'Klaim Sekarang!'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserStats;
