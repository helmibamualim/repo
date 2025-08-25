import { useState } from 'react';

interface Card {
  suit: string;
  rank: string;
  value: number;
}

interface Player {
  id: string;
  userId: string;
  username: string;
  position: number;
  chipsInPlay: number;
  currentBet: number;
  isSittingOut: boolean;
  isReady: boolean;
  hasFolded: boolean;
  hasActed: boolean;
  isAllIn: boolean;
  holeCards?: Card[];
}

interface GameState {
  id: string;
  gameNumber: number;
  dealerPosition: number;
  smallBlind: number;
  bigBlind: number;
  communityCards: Card[];
  totalPot: number;
  currentRound: string;
  currentPlayerTurn: string;
  currentBet: number;
  minRaise: number;
  status: string;
  startedAt: string;
}

interface TableState {
  id: string;
  name: string;
  maxPlayers: number;
  currentPlayers: number;
  minBet: number;
  maxBet: number;
  isPrivate: boolean;
  isGameInProgress: boolean;
  currentDealerPosition: number;
  potAmount: number;
  players: Player[];
  currentGame: GameState | null;
}

interface PokerTableProps {
  tableState: TableState;
  currentUserId: string;
  onPlayerAction: (action: string, amount?: number) => void;
}

const CardComponent = ({ card }: { card: Card }) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥️';
      case 'diamonds': return '♦️';
      case 'clubs': return '♣️';
      case 'spades': return '♠️';
      default: return '';
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg w-12 h-16 flex flex-col items-center justify-center text-xs font-bold shadow-md">
      <div className={getSuitColor(card.suit)}>
        {card.rank}
      </div>
      <div className={getSuitColor(card.suit)}>
        {getSuitSymbol(card.suit)}
      </div>
    </div>
  );
};

const PlayerSeat = ({ 
  player, 
  position, 
  isCurrentPlayer, 
  isDealer, 
  currentUserId,
  showHoleCards 
}: { 
  player: Player | null;
  position: number;
  isCurrentPlayer: boolean;
  isDealer: boolean;
  currentUserId: string;
  showHoleCards: boolean;
}) => {
  const getPositionStyle = (pos: number) => {
    const positions = [
      'top-4 left-1/2 transform -translate-x-1/2', // 0 - top center
      'top-8 right-8', // 1 - top right
      'top-1/2 right-4 transform -translate-y-1/2', // 2 - middle right
      'bottom-8 right-8', // 3 - bottom right
      'bottom-4 right-1/3 transform translate-x-1/2', // 4 - bottom right center
      'bottom-4 left-1/2 transform -translate-x-1/2', // 5 - bottom center
      'bottom-4 left-1/3 transform -translate-x-1/2', // 6 - bottom left center
      'bottom-8 left-8', // 7 - bottom left
      'top-1/2 left-4 transform -translate-y-1/2', // 8 - middle left
    ];
    return positions[pos] || positions[0];
  };

  if (!player) {
    return (
      <div className={`absolute ${getPositionStyle(position)}`}>
        <div className="bg-gray-300 border-2 border-dashed border-gray-400 rounded-lg p-4 w-24 h-20 flex items-center justify-center">
          <span className="text-gray-500 text-xs">Kosong</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute ${getPositionStyle(position)}`}>
      <div className={`bg-white rounded-lg p-3 shadow-lg border-2 ${
        isCurrentPlayer ? 'border-yellow-400 bg-yellow-50' : 
        player.hasFolded ? 'border-gray-400 bg-gray-100' : 'border-blue-400'
      } w-32`}>
        {/* Dealer Button */}
        {isDealer && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            D
          </div>
        )}
        
        {/* Player Info */}
        <div className="text-center">
          <div className="font-bold text-sm truncate">{player.username}</div>
          <div className="text-xs text-gray-600">
            {player.chipsInPlay.toLocaleString()} chips
          </div>
          {player.currentBet > 0 && (
            <div className="text-xs text-blue-600 font-semibold">
              Bet: {player.currentBet.toLocaleString()}
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center space-x-1 mt-1">
          {player.isSittingOut && (
            <span className="bg-gray-500 text-white text-xs px-1 rounded">Sit Out</span>
          )}
          {player.hasFolded && (
            <span className="bg-red-500 text-white text-xs px-1 rounded">Fold</span>
          )}
          {player.isAllIn && (
            <span className="bg-purple-500 text-white text-xs px-1 rounded">All In</span>
          )}
        </div>

        {/* Hole Cards */}
        {showHoleCards && player.holeCards && player.holeCards.length > 0 && (
          <div className="flex justify-center space-x-1 mt-2">
            {player.holeCards.map((card, index) => (
              <div key={index} className="w-8 h-10 bg-white border border-gray-300 rounded text-xs flex flex-col items-center justify-center">
                <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}>
                  {card.rank}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function PokerTable({ tableState, currentUserId, onPlayerAction }: PokerTableProps) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  const currentPlayer = tableState.players.find(p => p.userId === currentUserId);
  const isMyTurn = tableState.currentGame?.currentPlayerTurn === currentUserId;
  const canAct = isMyTurn && tableState.currentGame?.status === 'active';

  const handleAction = (action: string) => {
    if (action === 'raise') {
      if (raiseAmount > 0) {
        onPlayerAction(action, raiseAmount);
        setRaiseAmount(0);
        setShowRaiseInput(false);
      }
    } else {
      onPlayerAction(action);
    }
  };

  const getCallAmount = () => {
    if (!currentPlayer || !tableState.currentGame) return 0;
    return tableState.currentGame.currentBet - currentPlayer.currentBet;
  };

  const canCheck = () => {
    if (!currentPlayer || !tableState.currentGame) return false;
    return currentPlayer.currentBet >= tableState.currentGame.currentBet;
  };

  return (
    <div className="relative bg-green-700 rounded-xl p-8 min-h-[600px] border-8 border-green-800">
      {/* Table Center - Community Cards & Pot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          {/* Pot */}
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg mb-4 font-bold">
            Pot: {(tableState.currentGame?.totalPot || tableState.potAmount).toLocaleString()}
          </div>
          
          {/* Community Cards */}
          {tableState.currentGame && tableState.currentGame.communityCards.length > 0 && (
            <div className="flex justify-center space-x-2 mb-4">
              {tableState.currentGame.communityCards.map((card, index) => (
                <CardComponent key={index} card={card} />
              ))}
            </div>
          )}
          
          {/* Game Round */}
          {tableState.currentGame && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">
              {tableState.currentGame.currentRound.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Player Seats */}
      {Array.from({ length: tableState.maxPlayers }, (_, index) => {
        const player = tableState.players.find(p => p.position === index);
        const isCurrentPlayer = tableState.currentGame?.currentPlayerTurn === player?.userId;
        const isDealer = tableState.currentDealerPosition === index;
        const showHoleCards = player?.userId === currentUserId;
        
        return (
          <PlayerSeat
            key={index}
            player={player || null}
            position={index}
            isCurrentPlayer={isCurrentPlayer}
            isDealer={isDealer}
            currentUserId={currentUserId}
            showHoleCards={showHoleCards}
          />
        );
      })}

      {/* Action Buttons */}
      {canAct && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex space-x-2 mb-2">
              <button
                onClick={() => handleAction('fold')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Fold
              </button>
              
              {canCheck() ? (
                <button
                  onClick={() => handleAction('check')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={() => handleAction('call')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Call {getCallAmount().toLocaleString()}
                </button>
              )}
              
              <button
                onClick={() => setShowRaiseInput(!showRaiseInput)}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Raise
              </button>
              
              <button
                onClick={() => handleAction('all_in')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                All In
              </button>
            </div>
            
            {showRaiseInput && (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  placeholder="Jumlah raise"
                  className="border rounded px-3 py-1 w-32"
                  min={tableState.currentGame?.minRaise || 0}
                  max={currentPlayer?.chipsInPlay || 0}
                />
                <button
                  onClick={() => handleAction('raise')}
                  className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                >
                  Raise
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Turn Indicator */}
      {tableState.currentGame && (
        <div className="absolute top-4 right-4 bg-white rounded-lg p-2 shadow-lg">
          <div className="text-sm">
            <div className="font-bold">Giliran:</div>
            <div className="text-blue-600">
              {tableState.players.find(p => p.userId === tableState.currentGame?.currentPlayerTurn)?.username || 'Unknown'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
