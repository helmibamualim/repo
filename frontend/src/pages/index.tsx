import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import TableCard from '../components/TableCard';
import UserStats from '../components/UserStats';
import { useAuth, useAuthenticatedFetch } from '../contexts/AuthContext';

interface Table {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  isPrivate: boolean;
}

const HomePage: NextPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const router = useRouter();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch tables when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTables();
    }
  }, [isAuthenticated]);

  const fetchTables = async () => {
    try {
      // Try to fetch from API first
      const response = await authenticatedFetch('/api/game/tables');
      if (response && response.ok) {
        const data = await response.json();
        setTables(data);
      } else {
        // Use mock data if API fails
        setTables([
          {
            id: '1',
            name: 'Meja Pemula',
            currentPlayers: 3,
            maxPlayers: 6,
            minBet: 1000,
            maxBet: 10000,
            isPrivate: false,
          },
          {
            id: '2',
            name: 'Meja Menengah',
            currentPlayers: 5,
            maxPlayers: 9,
            minBet: 5000,
            maxBet: 50000,
            isPrivate: false,
          },
          {
            id: '3',
            name: 'Meja VIP',
            currentPlayers: 2,
            maxPlayers: 6,
            minBet: 25000,
            maxBet: 250000,
            isPrivate: false,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      // Fallback to mock data
      setTables([
        {
          id: '1',
          name: 'Meja Pemula',
          currentPlayers: 3,
          maxPlayers: 6,
          minBet: 1000,
          maxBet: 10000,
          isPrivate: false,
        },
        {
          id: '2',
          name: 'Meja Menengah',
          currentPlayers: 5,
          maxPlayers: 9,
          minBet: 5000,
          maxBet: 50000,
          isPrivate: false,
        },
        {
          id: '3',
          name: 'Meja VIP',
          currentPlayers: 2,
          maxPlayers: 6,
          minBet: 25000,
          maxBet: 250000,
          isPrivate: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Poker Online Gratis - Texas Hold&apos;em</title>
        <meta name="description" content="Bermain poker online gratis dengan chip virtual. Texas Hold'em terbaik di Indonesia!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              🃏 Selamat Datang, {user?.username || 'Player'}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Bermain Texas Hold&apos;em dengan chip virtual. Gratis selamanya!
            </p>
            <UserStats />
          </div>

          {/* Tables Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Meja Tersedia
              </h2>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Buat Meja Baru
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <TableCard key={table.id} table={table} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">1,234</div>
                <div className="text-blue-100">Pemain Online</div>
              </div>
              <div>
                <div className="text-2xl font-bold">56</div>
                <div className="text-blue-100">Meja Aktif</div>
              </div>
              <div>
                <div className="text-2xl font-bold">789</div>
                <div className="text-blue-100">Game Hari Ini</div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default HomePage;
