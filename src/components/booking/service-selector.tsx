'use client';

import React, { useEffect, useState } from 'react';
import { useTenant } from '@/components/tenant/tenant-provider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  imageUrl?: string;
  tenantId: string;
}

export function ServiceSelector() {
  const { shop } = useTenant();
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const tenantId = shop?.id || (shop as any)?.subdomain || '';

  useEffect(() => {
    let active = true;
    const fetchServices = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/services?tenantId=${tenantId}`);
        if (!res.ok) {
          throw new Error('Failed to retrieve catalog services');
        }
        const data = await res.json();
        if (active) {
          setServices(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'An error occurred while loading');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchServices();
    return () => {
      active = false;
    };
  }, [tenantId]);

  const categories: string[] = ['All', ...(Array.from(new Set(services.map(s => s.category))) as string[])];

  const filtered = selectedCategory === 'All' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6 p-6 bg-[#0a0a0b] border border-[#2a2a2d] rounded-xl text-stone-100 max-w-2xl mx-auto shadow-2xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#c5a059] animate-pulse" />
          <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono font-bold">Step 1: SELECT SERVICE</p>
        </div>
        <h2 id="service-selector-title-src" className="text-xl font-serif italic text-white">Select Catalog Treatment</h2>
        <p className="text-xs text-stone-400">Choose one of our premium treatments tailored for the {shop?.name || 'active regional branch'}.</p>
      </div>

      {/* Category Badges Filter */}
      {!loading && !error && services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-b border-[#2a2a2d] pb-4">
          {categories.map(cat => (
            <button
              id={`cat-badge-src-${cat.toLowerCase()}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold transition select-none cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]'
                  : 'bg-[#121214] text-stone-400 hover:text-stone-200 border border-[#2a2a2d]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3" id="services-loading-state-src">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center p-4 bg-[#121214] rounded-xl border border-[#2a2a2d] animate-pulse">
              <div className="w-16 h-16 rounded-lg bg-stone-850" />
              <div className="ml-4 flex-1 space-y-2">
                <div className="h-3.5 bg-stone-850 rounded w-1/3" />
                <div className="h-2.5 bg-stone-850 rounded w-2/3" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-3 bg-stone-850 rounded w-12" />
                  <div className="h-2.5 bg-stone-850 rounded w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs font-mono text-center" id="services-error-state-src">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-xs text-stone-500 italic py-8 text-center" id="services-empty-state-src">
          No services matching this filter context.
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-3" id="services-list-container-src">
          {filtered.map((svc: any) => {
            // Pick a robust placeholder image matching category if image is missing
            const fallbackImages: Record<string, string> = {
              'Hair': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=200',
              'Nails': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=200',
              'Skincare': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=200',
              'Massage': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=200',
            };
            const imageSrc = svc.imageUrl || fallbackImages[svc.category] || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200';

            return (
              <button
                id={`btn-svc-src-${svc.id}`}
                key={svc.id}
                onClick={() => router.push(`/book/staff?serviceId=${svc.id}`)}
                className="flex items-center p-4 bg-[#121214] rounded-xl border border-[#2a2a2d] hover:border-[#c5a059]/40 active:scale-[0.98] transition group text-left cursor-pointer w-full"
              >
                <div className="w-16 h-16 rounded-lg bg-[#0a0a0b] relative overflow-hidden flex-shrink-0 border border-[#2a2a2d] group-hover:border-[#c5a059]/30">
                  <Image 
                    src={imageSrc} 
                    alt={svc.name} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="font-serif italic text-sm text-stone-100 group-hover:text-white transition-colors">{svc.name}</h3>
                    <span className="font-mono text-xs font-bold text-[#c5a059]">
                      ₹{svc.price}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-relaxed">{svc.description}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]/40" />
                      {svc.duration} Mins
                    </span>
                    <span className="uppercase tracking-wider text-[9px] bg-[#1a1a1c] px-2 py-0.5 rounded border border-[#222] text-[#c5a059]/80 font-bold">
                      {svc.category}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
