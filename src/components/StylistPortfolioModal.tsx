import React, { useState } from 'react';
import { X, Star, Sparkles, Scissors, Check, Award, Calendar } from 'lucide-react';
import { Stylist } from '../types';

interface StylistPortfolioModalProps {
  stylist: Stylist;
  onClose: () => void;
  onSelectStylist: (stylistId: string) => void;
  isSelected: boolean;
}

const STYLIST_PORTFOLIOS: Record<string, Array<{ url?: string; title: string; category: string }>> = {
  'st-1': [
    { title: 'Royal Rajputana Bridal Updo', category: 'Bridal Hair' },
    { title: 'Sleek Silk Layered Blowout', category: 'Hair Styling' },
    { title: 'Balayage Golden Highlights', category: 'Hair Color' }
  ],
  'st-2': [
    { title: 'Classic Royal Shave & Beard Fade', category: 'Grooming' },
    { title: 'Textured Crop & Scissor Trim', category: 'Haircut' },
    { title: 'Herbal Scalp Champi Treatment', category: 'Spa' }
  ],
  'st-3': [
    { title: '24k Gold Facial Glow Finish', category: 'Skincare' },
    { title: 'HD Party Makeup & Lashes', category: 'Makeup' },
    { title: 'Botanical Ubtan Glow Ritual', category: 'Skin Therapy' }
  ],
  'st-4': [
    { title: 'Caramel Melt Hair Coloring', category: 'Hair Color' },
    { title: 'Keratin Smoothing Therapy', category: 'Hair Repair' },
    { title: 'Voluminous Hollywood Waves', category: 'Styling' }
  ]
};

export default function StylistPortfolioModal({
  stylist,
  onClose,
  onSelectStylist,
  isSelected
}: StylistPortfolioModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Fallback portfolio images if not explicitly mapped
  const portfolioItems = STYLIST_PORTFOLIOS[stylist.id] || [
    { title: 'Signature Hair Styling & Finish', category: 'Styling' },
    { title: 'Advanced Color Treatment', category: 'Color' },
    { title: 'Luxury Hair & Scalp Therapy', category: 'Treatment' }
  ];

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#121214] border border-[#2a2a2d] w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2d] sticky top-0 bg-[#121214] z-10">
          <div className="flex items-center gap-3">
            <img 
              src={stylist.imageUrl} 
              alt={stylist.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#c5a059]/40" 
            />
            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#c5a059] font-bold">Stylist Portfolio & Past Work</span>
              <h3 className="text-xl font-serif italic text-white">{stylist.name}</h3>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Stylist Bio & Specs */}
          <div className="bg-[#0a0a0b] border border-[#2a2a2d] p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-stone-300 leading-relaxed">{stylist.bio}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] text-xs font-mono font-bold flex items-center gap-1 shrink-0">
                <Star size={12} className="fill-[#c5a059] text-[#c5a059]" />
                {stylist.rating} ★
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] uppercase font-mono text-stone-500 font-bold">Specialties:</span>
              {stylist.specialties.map((spec, idx) => (
                <span key={idx} className="text-[10px] font-mono bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio Gallery Showcase */}
          <div className="space-y-3">
            <h4 className="text-sm font-serif italic text-white flex items-center gap-2">
              <Sparkles size={15} className="text-[#c5a059]" />
              <span>Past Work Portfolio Gallery</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {portfolioItems.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`bg-[#0a0a0b] border rounded-xl overflow-hidden cursor-pointer transition group ${
                    activeImageIndex === idx ? 'border-[#c5a059] ring-2 ring-[#c5a059]/30' : 'border-[#2a2a2d] hover:border-stone-600'
                  }`}
                >
                  <div className="h-36 bg-stone-900 relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={stylist.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono uppercase bg-black/60 backdrop-blur-xs text-[#c5a059] px-2 py-0.5 rounded border border-[#c5a059]/30">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-3">
                    <h5 className="text-xs font-bold text-white group-hover:text-[#c5a059] transition truncate">{item.title}</h5>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">Verified Jaipur Client Result</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#2a2a2d] flex items-center justify-between gap-4">
            <span className="text-xs text-stone-400">
              Select <strong className="text-white">{stylist.name}</strong> for your next session reservation.
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectStylist(stylist.id);
                onClose();
              }}
              className={`px-5 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow ${
                isSelected 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-[#c5a059] hover:bg-[#b08c49] text-black'
              }`}
            >
              {isSelected ? (
                <>
                  <Check size={14} />
                  <span>Selected Stylist</span>
                </>
              ) : (
                <>
                  <Calendar size={14} />
                  <span>Appoint {stylist.name.split(' ')[0]}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
