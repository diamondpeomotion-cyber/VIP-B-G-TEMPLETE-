import React, { useState } from 'react';
import { ImageIcon, X, Check } from 'lucide-react';
import { TextField, FieldLabel, GhostButton } from './fields';
import type { CuratedImage } from './curated';

interface ImageUrlFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  gallery?: CuratedImage[];
  galleryTitle?: string;
  aspect?: 'wide' | 'square';
  placeholder?: string;
  clearLabel?: string;
}

export default function ImageUrlField({
  label,
  hint,
  value,
  onChange,
  gallery,
  galleryTitle = 'Choose from our curated gallery',
  aspect = 'wide',
  placeholder = 'https://example.com/your-image.jpg',
  clearLabel,
}: ImageUrlFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="flex gap-2">
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title={clearLabel || 'Remove image'}
            className="px-3 border border-[#2a2a2d] rounded text-stone-500 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
        {gallery && gallery.length > 0 && (
          <GhostButton type="button" onClick={() => setPickerOpen(true)} className="shrink-0 px-3">
            <ImageIcon size={14} />
            <span className="hidden sm:inline">Gallery</span>
          </GhostButton>
        )}
      </div>

      {value && (
        <div className={`mt-2 rounded-md overflow-hidden border border-[#2a2a2d] ${aspect === 'square' ? 'w-24 h-24' : 'h-28 w-full max-w-xs'}`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {pickerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-[#121214] border border-[#2a2a2d] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#2a2a2d]">
              <div>
                <h3 className="font-serif italic text-white text-lg">{galleryTitle}</h3>
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  Free-to-use Unsplash photography — or paste your own image URL anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="p-2 text-stone-500 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className={`grid gap-3 p-5 overflow-y-auto ${aspect === 'square' ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {gallery!.map((img) => {
                const selected = value === img.url;
                return (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => {
                      onChange(img.url);
                      setPickerOpen(false);
                    }}
                    className={`relative group rounded-md overflow-hidden border-2 transition cursor-pointer ${selected ? 'border-[#c5a059]' : 'border-transparent hover:border-stone-600'} ${aspect === 'square' ? 'aspect-square' : 'aspect-video'}`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-stone-300 font-mono text-left px-2 pt-6 pb-1.5">
                      {img.label}
                    </span>
                    {selected && (
                      <span className="absolute top-2 right-2 bg-[#c5a059] text-black rounded-full p-1">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
