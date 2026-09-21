import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { VibeEvent } from '@/types';
import Hero from '@/components/Hero';
import TrendingCarousel from '@/components/TrendingCarousel';
import CategoryPills from '@/components/CategoryPills';
import EventCard from '@/components/EventCard';
import ValueProps from '@/components/ValueProps';

interface HomePageProps {
  events: VibeEvent[];
  onEventClick: (event: VibeEvent) => void;
  initialCategory?: string;
}

export default function HomePage({ events, onEventClick, initialCategory = '' }: HomePageProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchFilters, setSearchFilters] = useState({ category: '', location: '', date: '' });

  // Navbar dropdown එකෙන් category එක තෝරපු ගමන් activeCategory එක sync වී scroll වීම
  useEffect(() => {
    setActiveCategory(initialCategory);
    if (initialCategory) {
      setTimeout(() => {
        document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [initialCategory]);

  const handleSearch = (filters: { category: string; location: string; date: string }) => {
    setSearchFilters(filters);
    setActiveCategory(filters.category);
    const grid = document.getElementById('events-grid');
    grid?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const cat = String((e as any).category || '').toLowerCase();
      const catSlug = String((e as any).category_id || '').toLowerCase();
      const selected = activeCategory.toLowerCase();

      // Flexible Category Matching
      if (selected) {
        const isMatch =
          cat.includes(selected) ||
          selected.includes(cat) ||
          catSlug.includes(selected) ||
          (selected === 'edm' && (cat.includes('edm') || cat.includes('festival'))) ||
          (selected === 'acoustic' && cat.includes('acoustic')) ||
          (selected === 'concert' && cat.includes('concert'));

        if (!isMatch) return false;
      }

      if (searchFilters.location) {
        const loc = searchFilters.location.toLowerCase();
        const eventLoc = ((e as any).location || '').toLowerCase();
        const eventVenue = (e.venue || '').toLowerCase();
        if (!eventLoc.includes(loc) && !eventVenue.includes(loc)) return false;
      }

      if (searchFilters.date && e.event_date) {
        const eventDate = new Date(e.event_date).toISOString().split('T')[0];
        if (eventDate !== searchFilters.date) return false;
      }

      return true;
    });
  }, [events, activeCategory, searchFilters]);

  return (
    <div className="w-full min-h-screen">
      <Hero onSearch={handleSearch} />

      {/* Trending Carousel - Centered max-w-7xl Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TrendingCarousel events={events} onEventClick={onEventClick} />
      </div>

      {/* Popular Events Section - Balanced 4-column Grid */}
      <section id="events-grid" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {activeCategory
              ? activeCategory === 'Concert'
                ? 'Concerts'
                : activeCategory === 'EDM'
                ? 'EDM Festivals'
                : activeCategory === 'Acoustic'
                ? 'Acoustic Nights'
                : activeCategory
              : 'Popular Events'}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">Book your spot at Sri Lanka's hottest live music events</p>
        </div>

        <div className="mb-10 flex justify-center">
          <CategoryPills active={activeCategory} onSelect={setActiveCategory} />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No events match your search. Try different filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
            ))}
          </div>
        )}
      </section>

      <ValueProps />
    </div>
  );
}