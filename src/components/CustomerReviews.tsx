import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, User, Sparkles, Send } from 'lucide-react';
import { ClientReview } from '../types';

interface CustomerReviewsProps {
  salonName: string;
  salonId: string;
  initialReviews?: ClientReview[];
}

const DEFAULT_REVIEWS: ClientReview[] = [
  {
    id: 'rev-1',
    clientName: 'Priyanka Sharma',
    rating: 5,
    comment: 'Absolute luxury! The bridal makeup and hair styling at the C-Scheme branch for my wedding reception in Jaipur was immaculate. Received compliments all evening.',
    serviceName: 'Royal Rajputana Bridal Package',
    date: '2026-06-01'
  },
  {
    id: 'rev-2',
    clientName: 'Rohan Rathore',
    rating: 5,
    comment: 'Top-tier grooming and beard styling in Jaipur. The traditional head champi and hot towel ritual is exceptionally relaxing.',
    serviceName: 'Groom Shave & Beard Styling',
    date: '2026-05-28'
  },
  {
    id: 'rev-3',
    clientName: 'Neha Singhal',
    rating: 4,
    comment: 'Loved the 24k Gold Radiance facial. My skin felt so nourished and glowing. Great ambiance and polite staff.',
    serviceName: '24k Gold Radiance Facial',
    date: '2026-05-20'
  }
];

export function CustomerReviews({ salonName, salonId, initialReviews = DEFAULT_REVIEWS }: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<ClientReview[]>(initialReviews);
  const [newClientName, setNewClientName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newServiceName, setNewServiceName] = useState('Hair Spa & Blow Dry');
  const [newComment, setNewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newComment.trim()) return;

    const review: ClientReview = {
      id: `rev-${Date.now()}`,
      clientName: newClientName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      serviceName: newServiceName,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews([review, ...reviews]);
    setNewClientName('');
    setNewComment();
    setSubmittedSuccess(true);
    setIsFormOpen(false);
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  return (
    <div className="bg-[#121214] border border-[#2a2a2d] p-6 rounded-xl space-y-6">
      
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2a2a2d]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 rounded-sm bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[9px] uppercase font-mono font-bold">
              Verified Client Testimonials
            </span>
            <span className="text-[10px] text-stone-500 font-mono">Jaipur Salon Reviews</span>
          </div>
          <h3 className="text-xl font-serif italic text-white">Customer Reviews & Ratings</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Real feedback from valued clients who visited {salonName}.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0a0a0b] px-4 py-3 rounded-lg border border-[#2a2a2d]">
          <div className="text-right">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[10px] text-stone-400 font-mono mt-0.5 block">{reviews.length} Verified Reviews</span>
          </div>
          <div className="border-l border-stone-800 pl-4">
            <span className="text-2xl font-serif font-bold text-white">{avgRating}</span>
            <span className="text-[10px] text-[#c5a059] block font-mono">Out of 5.0</span>
          </div>
        </div>
      </div>

      {submittedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Thank you! Your verified client review and star rating have been published.</span>
        </div>
      )}

      {/* Action button to write review */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-stone-400">Showing all client testimonials</span>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded transition cursor-pointer flex items-center gap-1.5 shadow"
        >
          <Sparkles size={13} />
          <span>{isFormOpen ? 'Cancel Review' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Review Submission Form Modal / Expandable Card */}
      {isFormOpen && (
        <form onSubmit={handleSubmitReview} className="bg-[#0a0a0b] border border-[#c5a059]/40 p-5 rounded-xl space-y-4 animate-fadeIn">
          <h4 className="text-sm font-serif italic text-white font-bold">Share Your Experience at {salonName}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                placeholder="e.g. Ananya Singhania"
                className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">Service Experienced</label>
              <select
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
              >
                <option value="Royal Rajputana Bridal Package">Royal Rajputana Bridal Package</option>
                <option value="24k Gold Radiance Facial">24k Gold Radiance Facial</option>
                <option value="Moroccan Hair Spa & Scalp Therapy">Moroccan Hair Spa & Scalp Therapy</option>
                <option value="Groom Shave & Beard Styling">Groom Shave & Beard Styling</option>
                <option value="Signature Haircut & Blow Dry">Signature Haircut & Blow Dry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">Star Rating (1 to 5)</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                >
                  <Star 
                    size={22} 
                    className={`${(hoverRating || newRating) >= star ? 'fill-amber-400 text-amber-400' : 'text-stone-600'}`} 
                  />
                </button>
              ))}
              <span className="ml-3 text-xs font-mono font-bold text-[#c5a059]">{newRating}.0 / 5.0 Stars</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">Your Testimonial / Review</label>
            <textarea
              required
              rows={3}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Describe your visit, ambiance, stylist expertise, and results..."
              className="w-full bg-[#121214] text-xs border border-[#2a2a2d] rounded px-3 py-2 text-stone-200 outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded text-xs font-mono uppercase font-bold text-stone-400 bg-[#121214] border border-[#2a2a2d] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#c5a059] hover:bg-[#b08c49] text-black text-xs font-mono font-bold uppercase tracking-wider px-5 py-2 rounded transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={13} />
              <span>Submit Verified Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-4 bg-[#0a0a0b] border border-[#2a2a2d] rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#c5a059]/20 text-[#c5a059] font-serif font-bold text-sm flex items-center justify-center border border-[#c5a059]/30">
                  {rev.clientName.charAt(0)}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">{rev.clientName}</h5>
                  <span className="text-[9px] text-[#c5a059] font-mono block">{rev.serviceName}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={11} 
                      className={`${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`} 
                    />
                  ))}
                </div>
                <span className="text-[9px] text-stone-500 font-mono mt-0.5 block">{rev.date}</span>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans pt-1">
              "{rev.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomerReviews;
