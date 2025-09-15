import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/utils/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow space-y-4"
        >
          <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />
          {errorMessage && (
            <p className="text-red-400 text-sm text-center">{errorMessage}</p>
          )}␊
          <button
            type="submit"
            className="w-full py-2 rounded bg-red-500 hover:bg-red-600 transition-colors font-semibold"
          >
            Entrar
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
