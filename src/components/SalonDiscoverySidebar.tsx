import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, SlidersHorizontal, Scissors, 
  Clock, Check, RotateCcw, Star, Sparkles, Filter, X, ArrowUpDown
} from 'lucide-react';
import { Tenant, SalonService } from '../types';

interface SalonDiscoverySidebarProps {
  tenants: Tenant[];
  services: SalonService[];
  activeTenantId: string;
  onSelectServiceAndBranch: (serviceId: string, tenantId: string) => void;
  selectedServiceId?: string;
}

export default function SalonDiscoverySidebar({
  tenants,
  services,
  activeTenantId,
  onSelectServiceAndBranch,
  selectedServiceId
}: SalonDiscoverySidebarProps) {
  // Filter States
  const [selectedCity, setSelectedCity] = useState<string>('all'); // 'all' or 'Jaipur'
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [pricePreset, setPricePreset] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'duration' | 'rating'>('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Available cities derived from tenants
  const cityOptions = useMemo(() => {
    const cities = Array.from(new Set(tenants.map(t => t.city).filter(Boolean)));
    return cities.length > 0 ? cities : ['Jaipur'];
  }, [tenants]);

  // Available locations derived from tenants
  const locationOptions = useMemo(() => {
    return tenants.map(t => {
      let areaLabel = t.city;
      if (t.id === 'downtown-executive') areaLabel = 'C-Scheme (Central)';
      else if (t.id === 'uptown-chic') areaLabel = 'Malviya Nagar (South)';
      else if (t.id === 'coastal-breeze') areaLabel = 'Vaishali Nagar (West)';
      return {
        id: t.id,
        name: t.name,
        area: areaLabel,
        city: t.city || 'Jaipur',
        address: t.address,
        rating: t.rating
      };
    });
  }, [tenants]);

  // Available Categories derived from services
  const categoryOptions = [
    { id: 'Hair & Styling', label: 'Hair & Styling', icon: '✂️' },
    { id: 'Skin & Facials', label: 'Skin & Facials', icon: '✨' },
    { id: 'Bridal & Makeup', label: 'Bridal & Makeup', icon: '👰' },
    { id: 'Groom Shave & Beard Styling', label: "Grooming & Beard", icon: '👑' }
  ];

  // Price presets helper
  const handlePricePreset = (preset: string) => {
    setPricePreset(preset);
    if (preset === 'all') {
      setMinPrice(0);
      setMaxPrice(20000);
    } else if (preset === 'budget') {
      setMinPrice(0);
      setMaxPrice(1000);
    } else if (preset === 'mid') {
      setMinPrice(1000);
      setMaxPrice(3000);
    } else if (preset === 'premium') {
      setMinPrice(3000);
      setMaxPrice(7000);
    } else if (preset === 'luxury') {
      setMinPrice(7000);
      setMaxPrice(20000);
    }
  };

  // Toggle location selection
  const toggleLocation = (tenantId: string) => {
    setSelectedLocations(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  // Toggle category selection
  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCity('all');
    setSelectedLocations([]);
    setSelectedCategories([]);
    setMinPrice(0);
    setMaxPrice(20000);
    setPricePreset('all');
    setSearchQuery('');
    setSortBy('recommended');
  };

  // Filtered & Sorted services computation
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const tenantObj = tenants.find(t => t.id === service.tenantId);

      // 0. City Location Filter
      if (selectedCity !== 'all') {
        const cityMatch = tenantObj ? tenantObj.city.toLowerCase() === selectedCity.toLowerCase() : false;
        if (!cityMatch) return false;
      }

      // 1. Geographic Branch Location Filter
      if (selectedLocations.length > 0) {
        if (!service.tenantId || !selectedLocations.includes(service.tenantId)) {
          return false;
        }
      }

      // 2. Service Category Filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(service.category)) {
          return false;
        }
      }

      // 3. Price Range Filter
      if (service.price < minPrice || service.price > maxPrice) {
        return false;
      }

      // 4. Search Query Filter (Matches name, description, category, city, or branch address)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = service.name.toLowerCase().includes(q);
        const matchDesc = service.description.toLowerCase().includes(q);
        const matchCat = service.category.toLowerCase().includes(q);
        const matchTenant = tenantObj ? (
          tenantObj.name.toLowerCase().includes(q) || 
          tenantObj.address.toLowerCase().includes(q) ||
          tenantObj.city.toLowerCase().includes(q)
        ) : false;
        
        if (!matchName && !matchDesc && !matchCat && !matchTenant) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'duration') return a.duration - b.duration;
      if (sortBy === 'rating') {
        const ratingA = tenants.find(t => t.id === a.tenantId)?.rating || 0;
        const ratingB = tenants.find(t => t.id === b.tenantId)?.rating || 0;
        return ratingB - ratingA;
      }
      return 0; // recommended default order
    });
  }, [services, tenants, selectedCity, selectedLocations, selectedCategories, minPrice, maxPrice, searchQuery, sortBy]);

  const activeFilterCount = (selectedCity !== 'all' ? 1 : 0) +
    (selectedLocations.length > 0 ? 1 : 0) + 
    (selectedCategories.length > 0 ? 1 : 0) + 
    (pricePreset !== 'all' || minPrice > 0 || maxPrice < 20000 ? 1 : 0) + 
    (searchQuery.trim() ? 1 : 0);

  return (
    <div id="salon-discovery-portal-section" className="space-y-6">
      
      {/* Discovery Header Banner */}
      <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[9px] uppercase font-mono font-bold flex items-center gap-1">
              <Search size={11} />
              Salon Discovery & Service Search
            </span>
            <span className="text-[10px] text-stone-500 font-mono">Jaipur Rajasthan</span>
          </div>
          <h3 className="text-xl font-serif italic text-white">Find Salons & Book Services</h3>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Filter haircuts, hair spa, facials, and bridal packages by location area, price budget, or treatment category across Jaipur salon branches.
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="md:hidden w-full sm:w-auto bg-[#1c1c1f] border border-[#c5a059]/40 text-[#c5a059] px-4 py-2.5 rounded text-xs font-bold font-mono uppercase flex items-center justify-center gap-2 cursor-pointer shadow"
        >
          <Filter size={14} />
          <span>Filter Salons ({activeFilterCount})</span>
        </button>
      </div>

      {/* Main Layout: Sidebar Filters + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* ==================== FILTER SIDEBAR ==================== */}
        <aside 
          className={`lg:block ${isMobileFilterOpen ? 'block' : 'hidden'} bg-[#121214] border border-[#2a2a2d] rounded-lg p-5 space-y-6 sticky top-24 z-20 shadow-xl`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2d]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[#c5a059]" />
              <h4 className="text-sm font-serif italic font-bold text-white">Filter Results</h4>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[10px] font-mono text-[#c5a059] hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Search Box Filter */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">
              Search Service or Treatment
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search 'Hair Spa', 'Facial', 'Bridal'..."
                className="w-full bg-[#0a0a0b] text-xs border border-[#2a2a2d] rounded px-3 py-2 pl-8 text-stone-200 outline-none focus:border-[#c5a059]"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-stone-500" />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 1. Geographic Location & City Filter */}
          <div className="space-y-3 pt-3 border-t border-[#2a2a2d]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
                <MapPin size={12} className="text-[#c5a059]" />
                <span>1. City Location Filter</span>
              </label>
              <span className="text-[9px] font-mono text-[#c5a059] font-bold">Rajasthan</span>
            </div>

            {/* City Selection Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="btn-filter-city-all"
                onClick={() => setSelectedCity('all')}
                className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition cursor-pointer text-center ${
                  selectedCity === 'all'
                    ? 'bg-[#c5a059] text-black shadow'
                    : 'bg-[#0a0a0b] text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                All Cities
              </button>
              {cityOptions.map(city => (
                <button
                  key={city}
                  type="button"
                  id={`btn-filter-city-${city.toLowerCase()}`}
                  onClick={() => setSelectedCity(city)}
                  className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition cursor-pointer flex items-center justify-center gap-1 ${
                    selectedCity.toLowerCase() === city.toLowerCase()
                      ? 'bg-[#c5a059] text-black shadow font-extrabold'
                      : 'bg-[#0a0a0b] text-stone-300 hover:text-white border border-stone-800'
                  }`}
                >
                  <span>📍 {city}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] uppercase font-mono text-stone-500 block font-bold">
                {selectedCity !== 'all' ? `${selectedCity} Branches & Areas:` : 'Filter Specific Branch Area:'}
              </span>
              {locationOptions.map(loc => {
                const isChecked = selectedLocations.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleLocation(loc.id)}
                    className={`w-full text-left p-2.5 rounded border transition flex items-start justify-between cursor-pointer ${
                      isChecked
                        ? 'bg-[#c5a059]/15 border-[#c5a059] text-white'
                        : 'bg-[#0a0a0b] border-stone-800 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-serif font-bold text-stone-100">{loc.area}</span>
                        <span className="text-[9px] font-mono text-[#c5a059]">{loc.rating} ★</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{loc.name}</p>
                    </div>

                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked ? 'bg-[#c5a059] border-[#c5a059] text-black' : 'border-stone-700 bg-[#121214]'
                    }`}>
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Service Category Filter */}
          <div className="space-y-3 pt-3 border-t border-[#2a2a2d]">
            <label className="text-[10px] uppercase font-mono tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
              <Scissors size={12} className="text-[#c5a059]" />
              <span>2. Service Category</span>
            </label>

            <div className="space-y-1.5">
              {categoryOptions.map(cat => {
                const isChecked = selectedCategories.includes(cat.id);
                const count = services.filter(s => s.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full text-left p-2 rounded border transition flex items-center justify-between cursor-pointer ${
                      isChecked
                        ? 'bg-[#c5a059]/15 border-[#c5a059] text-white'
                        : 'bg-[#0a0a0b] border-stone-800 hover:border-stone-700 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{cat.icon}</span>
                      <span className="text-xs font-sans text-stone-200">{cat.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-stone-500">({count})</span>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-[#c5a059] border-[#c5a059] text-black' : 'border-stone-700 bg-[#121214]'
                      }`}>
                        {isChecked && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Price Range Filter */}
          <div className="space-y-3 pt-3 border-t border-[#2a2a2d]">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
                <span>💰 3. Price Range</span>
              </label>
              <span className="text-xs font-mono font-bold text-[#c5a059]">
                ₹{minPrice.toLocaleString('en-IN')} - ₹{maxPrice.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Quick Price Preset Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'budget', label: 'Under ₹1,000' },
                { id: 'mid', label: '₹1,000 - ₹3,000' },
                { id: 'premium', label: '₹3,000 - ₹7,000' },
                { id: 'luxury', label: '₹7,000+' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePricePreset(p.id)}
                  className={`px-2 py-1.5 rounded text-[9px] font-mono font-bold uppercase transition cursor-pointer ${
                    pricePreset === p.id
                      ? 'bg-[#c5a059] text-black shadow'
                      : 'bg-[#0a0a0b] text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Price Max Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[9px] text-stone-500 font-mono">
                <span>Min: ₹0</span>
                <span>Max Price: ₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="500"
                value={maxPrice}
                onChange={e => {
                  setMaxPrice(Number(e.target.value));
                  setPricePreset('custom');
                }}
                className="w-full accent-[#c5a059] cursor-pointer"
              />
            </div>
          </div>

          {/* Reset Filters CTA */}
          <div className="pt-3 border-t border-[#2a2a2d]">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full bg-[#0a0a0b] hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 text-xs font-mono font-bold py-2 rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset All Filters</span>
            </button>
          </div>
        </aside>

        {/* ==================== DISCOVERY RESULTS CATALOG ==================== */}
        <main className="lg:col-span-3 space-y-4">
          
          {/* Results Summary & Sorting Bar */}
          <div className="bg-[#121214] border border-[#2a2a2d] p-3.5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-serif italic text-white font-bold">
                Found {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'}
              </span>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                {selectedLocations.length > 0 
                  ? `Filtered across ${selectedLocations.length} selected Jaipur location areas`
                  : 'Available across all Jaipur branches (C-Scheme, Malviya Nagar, Vaishali Nagar)'
                }
              </p>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-500 flex items-center gap-1">
                <ArrowUpDown size={11} />
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#0a0a0b] border border-[#2a2a2d] text-xs font-mono font-bold text-stone-200 px-3 py-1.5 rounded outline-none focus:border-[#c5a059] cursor-pointer"
              >
                <option value="recommended">Featured / Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="duration">Duration: Shortest First</option>
                <option value="rating">Salon Rating</option>
              </select>
            </div>
          </div>

          {/* Filter Tags Summary Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs bg-[#0a0a0b] p-2.5 rounded border border-stone-850">
              <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">Active Filters:</span>

              {selectedCity !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#c5a059] text-[10px] font-mono flex items-center gap-1 font-bold">
                  🏙️ City: {selectedCity}
                  <button type="button" onClick={() => setSelectedCity('all')} className="hover:text-white">✕</button>
                </span>
              )}

              {selectedLocations.map(locId => {
                const locObj = locationOptions.find(l => l.id === locId);
                return (
                  <span key={locId} className="px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-mono flex items-center gap-1">
                    📍 {locObj?.area || locId}
                    <button type="button" onClick={() => toggleLocation(locId)} className="hover:text-white">✕</button>
                  </span>
                );
              })}

              {selectedCategories.map(cat => (
                <span key={cat} className="px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-mono flex items-center gap-1">
                  ✂️ {cat}
                  <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-white">✕</button>
                </span>
              ))}

              {pricePreset !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-mono flex items-center gap-1">
                  💰 Price: ₹{minPrice} - ₹{maxPrice}
                  <button type="button" onClick={() => handlePricePreset('all')} className="hover:text-white">✕</button>
                </span>
              )}

              {searchQuery && (
                <span className="px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-mono flex items-center gap-1">
                  🔍 "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-white">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Results Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-[#121214] border border-[#2a2a2d] p-12 rounded-lg text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto text-stone-500">
                <Search size={20} />
              </div>
              <h4 className="text-base font-serif italic text-white">No Matching Salon Services Found</h4>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                No services match your active filter criteria. Try broadening your price range or clearing location filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="bg-[#c5a059] text-black text-xs font-mono font-bold uppercase px-4 py-2 rounded transition hover:bg-[#b08c49] cursor-pointer"
              >
                Clear Filters & Show All Services
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map(service => {
                const tenantObj = tenants.find(t => t.id === service.tenantId);
                const isCurrentActiveTenant = service.tenantId === activeTenantId;
                const isSelectedForBooking = selectedServiceId === service.id;

                let locationBadge = tenantObj?.city || 'Jaipur';
                if (service.tenantId === 'downtown-executive') locationBadge = 'Central Jaipur • C-Scheme';
                else if (service.tenantId === 'uptown-chic') locationBadge = 'South Jaipur • Malviya Nagar';
                else if (service.tenantId === 'coastal-breeze') locationBadge = 'West Jaipur • Vaishali Nagar';

                return (
                  <div
                    key={service.id}
                    className={`bg-[#121214] border p-4 rounded-lg flex flex-col justify-between space-y-3 transition hover:border-[#c5a059]/60 relative ${
                      isSelectedForBooking
                        ? 'border-[#c5a059] ring-2 ring-[#c5a059]/40 shadow-lg'
                        : 'border-[#2a2a2d]'
                    }`}
                  >
                    <div>
                      {/* Location & Category Pill */}
                      <div className="flex justify-between items-start mb-1.5 flex-wrap gap-1">
                        <span className="text-[9px] font-mono font-bold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <MapPin size={9} />
                          {locationBadge}
                        </span>

                        <span className="text-[9px] font-mono text-stone-400 bg-[#0a0a0b] px-2 py-0.5 rounded border border-stone-800">
                          {service.category}
                        </span>
                      </div>

                      <h5 className="text-sm font-serif font-bold text-white mt-1">
                        {service.name}
                      </h5>

                      <p className="text-xs text-stone-400 mt-1 leading-snug line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Booking Trigger */}
                    <div className="pt-3 border-t border-[#2a2a2d] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[#c5a059] font-mono font-bold text-base">
                            ₹{service.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono flex items-center gap-0.5">
                            <Clock size={10} />
                            {service.duration} Mins
                          </span>
                        </div>

                        {tenantObj && (
                          <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                            <Star size={10} className="fill-[#c5a059] text-[#c5a059]" />
                            {tenantObj.rating}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[9px] text-stone-500 font-mono truncate max-w-[150px]">
                          {tenantObj?.name}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (service.tenantId) {
                              onSelectServiceAndBranch(service.id, service.tenantId);
                            }
                          }}
                          className={`text-[10px] font-mono font-extrabold uppercase px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 shadow ${
                            isSelectedForBooking
                              ? 'bg-emerald-500 text-black'
                              : 'bg-[#c5a059] hover:bg-[#b08c49] text-black'
                          }`}
                        >
                          {isSelectedForBooking ? (
                            <>
                              <Check size={11} />
                              <span>Selected for Booking</span>
                            </>
                          ) : (
                            <span>Book at {tenantObj?.city || 'Branch'} →</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
