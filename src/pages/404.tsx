import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Custom404() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <p className="text-xl text-gray-400 mb-8">Página no encontrada</p>
          <Link href="/" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
