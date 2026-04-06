'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Sparkles, ShoppingBag } from 'lucide-react';

export default function WelcomePage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const code = localStorage.getItem('referral_code');
    setReferralCode(code);
  }, []);

  const simulateSale = async () => {
    if (!referralCode) return;
    try {
      await api.post('/track/sale', {
        referral_code: referralCode,
        amount: 299.99,
        order_id: `SALE-${Math.floor(Math.random() * 10000)}`,
      });
      alert('Sale simulated successfully! The affiliate will see this in their dashboard.');
    } catch (error) {
       console.error('Sale simulation error', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-12 p-8 overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="text-center space-y-4 max-w-2xl animate-fade-in">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-3xl flex items-center justify-center mb-8 rotate-12 hover:rotate-0 transition-transform duration-500 shadow-2xl">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
          Welcome to FalakCart
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          You've arrived via a special referral link! Explore our premium selection of products and services designed for maximum impact.
        </p>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50 space-y-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-zinc-800 rounded-2xl">
             <ShoppingBag className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selected Plan</div>
            <div className="text-xl font-bold text-white">FalakCart Platinum Pro</div>
          </div>
        </div>
        
        <div className="space-y-3">
           <div className="flex justify-between text-sm">
             <span className="text-zinc-500 font-medium tracking-tight">Price</span>
             <span className="text-white font-bold">$299.99</span>
           </div>
           <div className="flex justify-between text-sm items-center">
             <span className="text-zinc-500 font-medium tracking-tight">Referral Code Applied</span>
             <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg font-mono text-xs font-bold">
               {referralCode || 'NONE'}
             </span>
           </div>
        </div>

        <button 
          onClick={simulateSale}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl font-bold text-white shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Complete Subscription
        </button>
        <p className="text-center text-zinc-500 text-[10px] font-medium tracking-tight uppercase">
          Try this to see the affiliate dashboard update in real-time
        </p>
      </div>
    </div>
  );
}
