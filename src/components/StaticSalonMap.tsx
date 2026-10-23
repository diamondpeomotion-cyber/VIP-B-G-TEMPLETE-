import React, { useState } from 'react';
import { MapPin, Navigation, Copy, Check, Compass, Shield, Phone, ExternalLink } from 'lucide-react';
import { Tenant } from '../types';

interface StaticSalonMapProps {
  tenant: Tenant;
  className?: string;
}

export default function StaticSalonMap({ tenant, className = '' }: StaticSalonMapProps) {
  const [copied, setCopied] = useState<boolean>(false);

  // Branch-specific map metadata & coordinates
  const branchMapMeta = React.useMemo(() => {
    if (tenant?.id === 'uptown-chic') {
      return {
        areaName: 'Malviya Nagar (South Jaipur)',
        landmark: 'Near World Trade Park (WTP) Mall',
        gpsCoords: '26.8532° N, 75.8048° E',
        landmarksList: ['World Trade Park • 200m', 'GT Central • 350m', 'Airport Road • 1.5 km'],
        mapCenterLabel: 'Royal Tresses Malviya Nagar Studio',
        pinX: 62,
        pinY: 48,
        streetPattern: 'grid-south'
      };
    } else if (tenant?.id === 'coastal-breeze') {
      return {
        areaName: 'Vaishali Nagar (West Jaipur)',
        landmark: 'Near Amrapali Circle & Queens Road',
        gpsCoords: '26.9088° N, 75.7482° E',
        landmarksList: ['Amrapali Circle • 100m', 'National Handloom • 250m', 'Queens Road • 400m'],
        mapCenterLabel: 'Royal Tresses Vaishali Spa Retreat',
        pinX: 38,
        pinY: 55,
        streetPattern: 'radial-west'
      };
    }
    // Default: downtown-executive (C-Scheme)
    return {
      areaName: 'C-Scheme (Central Jaipur)',
      landmark: 'Near Statue Circle & Central Park',
      gpsCoords: '26.9124° N, 75.7873° E',
      landmarksList: ['Statue Circle • 150m', 'Central Park • 400m', 'Rambagh Palace • 1.2 km'],
      mapCenterLabel: 'Royal Tresses Atelier C-Scheme',
      pinX: 50,
      pinY: 42,
      streetPattern: 'historic-central'
    };
  }, [tenant]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${tenant.name}, ${tenant.address}, ${tenant.city}, Rajasthan`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenant.name} ${tenant.address} Jaipur`)}`;

  return (
    <div className={`bg-[#121214] border border-[#2a2a2d] rounded-xl overflow-hidden shadow-2xl flex flex-col ${className}`}>
      
      {/* Map Header Bar */}
      <div className="p-4 bg-[#0a0a0b] border-b border-[#2a2a2d] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30">
            <Compass size={14} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-mono font-bold text-[#c5a059]">
                PHYSICAL SALON LOCATION
              </span>
              <span className="text-[8px] font-mono bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded uppercase">
                Static Location Map
              </span>
            </div>
            <h4 className="text-sm font-serif font-bold text-white">{tenant.name}</h4>
          </div>
        </div>

        <span className="text-[10px] font-mono bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 px-2 py-0.5 rounded font-bold hidden sm:block">
          GPS: {branchMapMeta.gpsCoords}
        </span>
      </div>

      {/* Static Non-Interactive Vector Map Visual Canvas */}
      <div className="relative w-full h-56 bg-[#0a0a0b] overflow-hidden select-none pointer-events-none">
        
        {/* Background Grid & Street Lines SVG (Non-Interactive) */}
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`map-grid-${tenant.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a2a2d" strokeWidth="0.8" />
            </pattern>

            {/* Custom Linear Gradient for Map Highlights */}
            <linearGradient id="gold-river-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c5a059" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c5a059" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Base Grid Pattern */}
          <rect width="100%" height="100%" fill={`url(#map-grid-${tenant.id})`} />

          {/* Major Roads Geometry Overlay */}
          <g stroke="#3a3a3e" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M 0,80 Q 200,90 400,60 T 800,100" />
            <path d="M 120,0 L 150,300" strokeWidth="3" stroke="#4a4a4e" />
            <path d="M 0,160 C 250,150 350,180 800,140" strokeWidth="3.5" stroke="#c5a059" strokeOpacity="0.35" />
            <path d="M 320,0 Q 300,150 280,300" />
            <path d="M 0,220 L 800,210" strokeDasharray="4 4" stroke="#2a2a2d" />
          </g>

          {/* Landmark Area Contour Outlines */}
          <circle cx="50%" cy="45%" r="38" fill="none" stroke="#c5a059" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="50%" cy="45%" r="75" fill="none" stroke="#2a2a2d" strokeWidth="1" opacity="0.8" />

          {/* Secondary Street Arteries */}
          <path d="M 50,40 L 450,220 M 100,250 L 500,50 M 200,10 L 250,280" stroke="#1c1c1f" strokeWidth="1.5" />
        </svg>

        {/* Static Map Label Watermarks */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-stone-600 font-bold uppercase tracking-widest bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded border border-stone-850">
          📍 {branchMapMeta.areaName}
        </div>

        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-stone-500 bg-black/70 backdrop-blur-xs p-1.5 rounded border border-stone-800 space-y-0.5">
          <span className="block font-bold text-stone-300">LANDMARKS:</span>
          <div className="flex gap-2 text-[8px] text-stone-400">
            {branchMapMeta.landmarksList.map((lm, idx) => (
              <span key={idx}>• {lm}</span>
            ))}
          </div>
        </div>

        {/* Central Luxury Gold Pin Marker with Pulse Animation */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${branchMapMeta.pinX}%`, top: `${branchMapMeta.pinY}%` }}
        >
          {/* Animated Gold Pulse Ring */}
          <span className="absolute -inset-2 rounded-full bg-[#c5a059]/30 animate-ping opacity-75"></span>
          
          {/* Main Pin Card Callout */}
          <div className="bg-[#121214] border-2 border-[#c5a059] px-2.5 py-1 rounded-lg shadow-2xl flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-[#c5a059] animate-pulse"></span>
            <span className="text-[10px] font-serif font-bold text-white whitespace-nowrap">
              {tenant.name}
            </span>
          </div>

          {/* Gold Pin Arrow Icon */}
          <div className="text-[#c5a059] -mt-1 drop-shadow-md">
            <MapPin size={26} className="fill-[#c5a059] text-black" />
          </div>
        </div>

        {/* Non-Interactive Overlay Watermark Tag */}
        <div className="absolute top-3 right-3 text-[8px] font-mono text-stone-500 bg-stone-900/80 backdrop-blur-xs px-2 py-0.5 rounded border border-stone-800 uppercase tracking-widest">
          🔒 Static Map View
        </div>
      </div>

      {/* Address & Navigation Details Footer */}
      <div className="p-4 bg-[#0a0a0b] border-t border-[#2a2a2d] space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-[9px] uppercase font-mono text-stone-500 font-bold block">
              Physical Street Address
            </span>
            <p className="text-xs text-stone-200 font-serif italic mt-0.5">
              {tenant.address}, {tenant.city}, Rajasthan
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-stone-400">
            <Phone size={11} className="text-[#c5a059]" />
            <span>{tenant.phone}</span>
          </div>
        </div>

        {/* Action Buttons for Location */}
        <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyAddress}
            className="px-3 py-1.5 rounded text-[10px] uppercase font-mono font-bold bg-[#121214] border border-stone-800 hover:border-[#c5a059]/40 text-stone-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[#c5a059]" />}
            <span>{copied ? 'Address Copied!' : 'Copy Full Address'}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded text-[10px] uppercase font-mono font-bold bg-[#c5a059] hover:bg-[#b08c49] text-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Navigation size={12} />
            <span>Open Directions in Google Maps</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
