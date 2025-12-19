import { useState } from 'react';
import { X, Camera, Send } from 'lucide-react';

const MaintenanceModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
    setPhotos([...photos, ...newPhotos]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ title, description, priority, photos });
      setSubmitting(false);
      setTitle(''); setDescription(''); setPriority('medium'); setPhotos([]);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">New Maintenance Request</h2>
              <p className="text-amber-100 text-sm mt-1">Describe your issue and we'll get it fixed</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Issue Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Leaking faucet in bathroom"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 capitalize transition-all ${
                    priority === p
                      ? p === 'high' ? 'border-red-500 bg-red-50 text-red-600' :
                        p === 'medium' ? 'border-amber-500 bg-amber-50 text-amber-600' :
                        'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-slate-200 text-slate-500'
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..." rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 resize-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Photos (Optional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-amber-400 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click to upload photos</p>
              </label>
            </div>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img src={photo.url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>)
              : (<><Send className="w-5 h-5" />Submit Request</>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceModal;
