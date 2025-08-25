import { NextPage } from 'next';

const TestPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🃏 Test Page - Poker Online
        </h1>
        <p className="text-gray-600">
          Jika halaman ini muncul, berarti setup dasar sudah bekerja!
        </p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">✅ Frontend berhasil berjalan</p>
          <p className="text-green-800">✅ Tailwind CSS bekerja</p>
          <p className="text-green-800">✅ Next.js konfigurasi OK</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
