import { QrCode, BadgeCheck, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Instant QR Access',
    description: 'Get your digital ticket with a unique QR code instantly after checkout. No waiting, no printing.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Organizers',
    description: 'Every event is hosted by vetted, trusted organizers. Buy with confidence every time.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Mock Checkout',
    description: 'LankaQR and Card payment options with a smooth, secure mock checkout flow.',
  },
];

export default function ValueProps() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl border border-purple-500/15 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-rose-500/30 hover:bg-white/[0.05]"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/0 to-purple-500/0 group-hover:from-rose-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-rose-500/30 group-hover:to-purple-600/30 transition-all">
                  <Icon className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
