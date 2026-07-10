import { Gamepad2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Gamepad2 size={48} className="animate-spin text-orange-500" />
    </div>
  );
}
