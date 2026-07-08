import { create } from 'zustand';

export const PAYMENT_OPTIONS = [
  { 
    id: 'US', 
    flag: '🇺🇸', 
    name: 'EEUU / Otros', 
    currency: 'USD', 
    fullName: 'United States Dollar', 
    rate: 1, 
    symbol: '$', 
    instructions: 'Binance Pay ID:\n468856753' 
  },
  { 
    id: 'MX', 
    flag: '🇲🇽', 
    name: 'México', 
    currency: 'MXN', 
    fullName: 'Mexican Peso', 
    rate: 17.50, 
    symbol: '$', 
    instructions: 'Transferencia Interbancaria:\n728969000114678903\n\nSpin pago por OXXO:\n2242 1701 8064 3778' 
  },
  { 
    id: 'CO', 
    flag: '🇨🇴', 
    name: 'Colombia', 
    currency: 'COP', 
    fullName: 'Colombian Peso', 
    rate: 3900, 
    symbol: '$', 
    instructions: 'Nequi:\n3173326415' 
  },
  { 
    id: 'PE', 
    flag: '🇵🇪', 
    name: 'Perú', 
    currency: 'PEN', 
    fullName: 'Sol', 
    rate: 3.75, 
    symbol: 'S/', 
    instructions: 'Yape:\n998329414' 
  }
];

interface CurrencyState {
  selectedCountry: string;
  setCountry: (id: string) => void;
  getActiveConfig: () => typeof PAYMENT_OPTIONS[0];
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  selectedCountry: 'US',
  setCountry: (id) => set({ selectedCountry: id }),
  getActiveConfig: () => PAYMENT_OPTIONS.find(c => c.id === get().selectedCountry) || PAYMENT_OPTIONS[0]
}));