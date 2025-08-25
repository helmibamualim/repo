import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import PokerTable from '../../components/PokerTable';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

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
  holeCards?: any[];
}

interface GameState {
  id: string;
  gameNumber: number;
  dealerPosition: number;
  smallBlind: number;
  bigBlind: number;
  communityCards: any[];
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

interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string;
}

export default function GamePage() {
  const router = useRouter();
  const { tableId } = router.query;
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !tableId) return;

    // Initialize socket connection
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/game`, {
      auth: {
        token: token,
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to game server');
    });

    newSocket.on('connected', (data) => {
      console.log('Game connection confirmed:', data);
      // Join table
      newSocket.emit('joinTable', { tableId });
    });

    newSocket.on('tableJoined', (data) => {
      console.log('Joined table:', data);
      setTableState(data.tableState);
      setLoading(false);
    });

    newSocket.on('tableState', (data) => {
      setTableState(data.tableState);
    });

    newSocket.on('gameStarted', (data) => {
      console.log('Game started:', data);
      toast.success('Game dimulai!');
      // Request updated table state
      newSocket.emit('getTableState', { tableId });
    });

    newSocket.on('playerActionProcessed', (data) => {
      console.log('Player action processed:', data);
      // Request updated table state
      newSocket.emit('getTableState', { tableId });
    });

    newSocket.on('gameCompleted', (data) => {
      console.log('Game completed:', data);
      toast.success(`Game selesai! Pemenang: ${data.winnerUserId}`);
      // Request updated table state
      newSocket.emit('getTableState', { tableId });
    });

    newSocket.on('playerJoined', (data) => {
      console.log('Player joined:', data);
      toast.success(`Pemain bergabung ke meja`);
      // Request updated table state
      newSocket.emit('getTableState', { tableId });
    });

    newSocket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      toast(`Pemain meninggalkan meja`);
      // Request updated table state
      newSocket.emit('getTableState', { tableId });
    });

    newSocket.on('messageReceived', (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'Terjadi kesalahan');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from game server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, token, tableId]);

  const handleStartGame = () => {
    if (socket && tableId) {
      socket.emit('startGame', { tableId });
    }
  };

  const handlePlayerAction = (action: string, amount?: number) => {
    if (socket && tableState?.currentGame) {
      socket.emit('playerAction', {
        gameId: tableState.currentGame.id,
        action,
        amount,
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (socket && chatInput.trim() && tableId) {
      socket.emit('sendMessage', {
        tableId,
        message: chatInput.trim(),
      });
      setChatInput('');
    }
  };

  const handleLeaveTable = () => {
    if (socket && tableId) {
      socket.emit('leaveTable', { tableId });
      router.push('/');
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 mb-4">Anda harus login untuk mengakses halaman ini.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Menghubungkan ke meja...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tableState) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Meja Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-4">Meja yang Anda cari tidak ditemukan.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Kembali ke Lobby
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-green-800 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">{tableState.name}</h1>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isConnected ? 'Terhubung' : 'Terputus'}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {!tableState.isGameInProgress && tableState.players.length >= 2 && (
              <button
                onClick={handleStartGame}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                Mulai Game
              </button>
            )}
            <button
              onClick={handleLeaveTable}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Tinggalkan Meja
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Poker Table */}
          <div className="lg:col-span-3">
            <PokerTable
              tableState={tableState}
              currentUserId={user.id}
              onPlayerAction={handlePlayerAction}
            />
          </div>

          {/* Chat & Info Panel */}
          <div className="space-y-4">
            {/* Table Info */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold mb-2">Info Meja</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Pemain:</span>
                  <span>{tableState.currentPlayers}/{tableState.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Bet:</span>
                  <span>{tableState.minBet.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Bet:</span>
                  <span>{tableState.maxBet.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pot:</span>
                  <span>{tableState.potAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Game Info */}
            {tableState.currentGame && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold mb-2">Info Game</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Round:</span>
                    <span className="capitalize">{tableState.currentGame.currentRound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Small Blind:</span>
                    <span>{tableState.currentGame.smallBlind.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Big Blind:</span>
                    <span>{tableState.currentGame.bigBlind.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pot:</span>
                    <span>{tableState.currentGame.totalPot.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold mb-2">Chat</h3>
              <div className="h-64 overflow-y-auto mb-4 border rounded p-2">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-semibold text-blue-600">{msg.userId}:</span>
                    <span className="ml-2">{msg.message}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={200}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
