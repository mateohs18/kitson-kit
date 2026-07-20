import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const PAYMENT_OPTIONS = [
  { 
    id: 'US', flag: '🇺🇸', name: 'EEUU / Otros', currency: 'USD', fullName: 'United States Dollar', rate: 1, symbol: '$', 
    accounts: [{ method: 'Binance Pay ID', number: '468856753' }]
  },
  { 
    id: 'MX', flag: '🇲🇽', name: 'México', currency: 'MXN', fullName: 'Mexican Peso', rate: 17.50, symbol: '$', 
    accounts: [
      { method: 'Transferencia Interbancaria', number: '728969000114678903' },
      { method: 'Spin pago por OXXO', number: '2242 1701 8064 3778' }
    ]
  },
  { 
    id: 'CO', flag: '🇨🇴', name: 'Colombia', currency: 'COP', fullName: 'Colombian Peso', rate: 3900, symbol: '$', 
    accounts: [{ method: 'Nequi', number: '3173326415' }]
  },
  { 
    id: 'PE', flag: '🇵🇪', name: 'Perú', currency: 'PEN', fullName: 'Sol', rate: 3.75, symbol: 'S/', 
    accounts: [{ method: 'Yape', number: '998329414' }]
  }
];

// Mapa de código de país (ISO) -> id interno de PAYMENT_OPTIONS
const COUNTRY_TO_OPTION: Record<string, string> = {
  MX: 'MX',
  CO: 'CO',
  PE: 'PE',
};

interface CurrencyState {
  selectedCountry: string;
  hasAutoDetected: boolean;
  hasManuallySelected: boolean;
  liveRates: Record<string, number>;
  setCountry: (id: string) => void;
  getActiveConfig: () => typeof PAYMENT_OPTIONS[0];
  autoDetectCountry: () => Promise<void>;
  loadLiveRates: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      selectedCountry: 'US',
      hasAutoDetected: false,
      hasManuallySelected: false,
      liveRates: {},
      setCountry: (id) => set({ selectedCountry: id, hasManuallySelected: true }),
      getActiveConfig: () => {
        const base = PAYMENT_OPTIONS.find(c => c.id === get().selectedCountry) || PAYMENT_OPTIONS[0];
        const liveRate = get().liveRates[base.id];
        return liveRate ? { ...base, rate: liveRate } : base;
      },
      autoDetectCountry: async () => {
        // Si el usuario ya eligió a mano alguna vez, o ya intentamos detectar antes, no hacemos nada.
        if (get().hasManuallySelected || get().hasAutoDetected) return;
        set({ hasAutoDetected: true });
        try {
          const res = await fetch('https://free.freeipapi.com/api/json/');
          if (!res.ok) return;
          const data = await res.json();
          const match = COUNTRY_TO_OPTION[data.countryCode];
          if (match) set({ selectedCountry: match });
        } catch {
          // Si falla la detección, nos quedamos con USD sin romper nada.
        }
      },
      loadLiveRates: async () => {
        // Trae las tasas que vos cargaste desde el panel de admin. Si falla
        // (sin internet, servidor caído), se sigue usando el valor fijo de
        // PAYMENT_OPTIONS de arriba — nunca se rompen los precios.
        try {
          const res = await fetch('/api/tasas-cambio');
          if (!res.ok) return;
          const data = await res.json();
          if (data.rates) set({ liveRates: data.rates });
        } catch {
          // Silencioso a propósito: si falla, seguimos con las tasas fijas.
        }
      },
    }),
    { name: 'kitson-currency', partialize: (state) => ({ selectedCountry: state.selectedCountry, hasAutoDetected: state.hasAutoDetected, hasManuallySelected: state.hasManuallySelected }) }
  )
);