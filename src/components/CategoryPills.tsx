import { Music, Zap, Guitar } from 'lucide-react';

interface CategoryPillsProps {
  active: string;
  onSelect: (category: string) => void;
}

const pills = [
  { label: 'All Events', value: '', icon: Music },
  { label: 'Concerts', value: 'Concert', icon: Music },
  { label: 'EDM Festivals', value: 'EDM', icon: Zap },
  { label: 'Acoustic Nights', value: 'Acoustic', icon: Guitar },
];

export default function CategoryPills({ active, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {pills.map((pill) => {
        const Icon = pill.icon;
        const isActive = active === pill.value;
        return (
          <button
            key={pill.label}
            onClick={() => onSelect(pill.value)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/5 text-gray-300 border border-purple-500/15 hover:bg-white/10 hover:text-white hover:border-purple-500/30'
            }`}
          >
            <Icon className="w-4 h-4" />
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
