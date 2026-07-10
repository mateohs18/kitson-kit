"use client";

import { useState, useRef, useEffect } from 'react';
import { useCurrencyStore, PAYMENT_OPTIONS } from '../store/currencyStore';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCountry, setCountry } = useCurrencyStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const active = PAYMENT_OPTIONS.find(c => c.id === selectedCountry) || PAYMENT_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-[#0A0806] px-3 py-1.5 rounded-lg border-2 border-[#0A0806] hover:opacity-90 transition text-xs font-bold"
      >
        <span className="text-base leading-none">{active.flag}</span>
        <span className="hidden sm:block text-[#F5F1E6]">{active.currency} - {active.name}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ml-1 ${isOpen ? 'rotate-180 text-[#E3A23D]' : 'text-[#9A9384]'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-56 kk-panel rounded-2xl overflow-hidden z-[100]">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setCountry(opt.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0 ${selectedCountry === opt.id ? 'bg-[#E3A23D]/10' : ''}`}
            >
              <span className="text-xl">{opt.flag}</span>
              <div className="text-left">
                <p className="text-sm font-bold text-[#F5F1E6]">{opt.currency}</p>
                <p className="text-xs text-[#9A9384]">{opt.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
