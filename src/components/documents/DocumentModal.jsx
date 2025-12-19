import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';

const DocumentModal = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('lease');
  const [property, setProperty] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e) => {
    e.preventDefault();
    setUploading(true);
    setTimeout(() => {
      onUpload({ file, docType, property });
      setUploading(false);
      setFile(null); setDocType('lease'); setProperty('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Upload Document</h2>
              <p className="text-violet-200 text-sm mt-1">Add lease agreements, inspections, and more</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500">
              <option value="lease">Lease Agreement</option>
              <option value="inspection">Property Inspection</option>
              <option value="insurance">Insurance Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
            <input type="text" value={property} onChange={(e) => setProperty(e.target.value)}
              placeholder="e.g., 742 Evergreen Terrace, Unit A"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-400 transition-colors">
              <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="doc-upload" />
              <label htmlFor="doc-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-violet-500" />
                    <span className="text-slate-700 font-medium">{file.name}</span>
                  </div>
                ) : (
                  <><Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">Click to upload PDF</p></>
                )}
              </label>
            </div>
          </div>

          <button type="submit" disabled={uploading || !file}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>)
              : (<><Upload className="w-5 h-5" />Upload Document</>)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DocumentModal;
