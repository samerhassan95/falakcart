'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function ReferralRedirect() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.code) {
      recordClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  const recordClick = async () => {
    try {
      console.log('Recording click for code:', params.code);
      const response = await api.get(`/track/click?ref=${params.code}`);
      console.log('Click recorded successfully:', response.data);
      
      // Save referral code in local storage or cookie for later sale recording
      localStorage.setItem('referral_code', params.code as string);
      
      // Redirect to the actual FalakCart (placeholder here)
      // window.location.href = 'https://falakcart.com';
      setTimeout(() => {
          router.push('/welcome');
      }, 1500);
    } catch (err: any) {
      console.error('Click tracking error', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Invalid referral link');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-4">
      {!error ? (
        <>
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <h1 className="text-xl font-medium">Redirecting you to FalakCart...</h1>
          <p className="text-zinc-500 text-sm">Please wait while we process your referral.</p>
        </>
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">{error}</h1>
          <p className="text-zinc-400">This referral link might be expired or invalid.</p>
          <button 
             onClick={() => router.push('/')}
             className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      )}
    </div>
  );
}
