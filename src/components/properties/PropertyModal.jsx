import { useEffect, useRef, useState } from 'react';
import { X, Home, MapPin, Building2 } from 'lucide-react';

const PropertyModal = ({ isOpen, onClose, onCreate }) => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    unit_number: '',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const abortRef = useRef(null);

  // Ensure callbacks are functions (after hooks)
  const safeOnClose = typeof onClose === 'function' ? onClose : () => {};
  const safeOnCreate = typeof onCreate === 'function' ? onCreate : null;

  // Early return AFTER all hooks
  if (!isOpen) return null;

  useEffect(() => {
    if (!mapboxToken || !addressQuery.trim()) {
      setAddressResults([]);
      setAddressError(null);
      return;
    }

    const controller = new AbortController();
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        setAddressLoading(true);
        setAddressError(null);
        const query = encodeURIComponent(addressQuery.trim());
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?types=address&country=us&limit=5&access_token=${mapboxToken}`;
        const response = await fetch(url, { signal: controller.signal });
        
        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response from Mapbox API');
        }
        
        // Handle Mapbox API errors in response
        if (data.error) {
          throw new Error(data.error.message || 'Mapbox API error');
        }
        
        setAddressResults(Array.isArray(data.features) ? data.features : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching address suggestions:', error);
          setAddressResults([]);
          // Only show error if it's not a network error (user might be offline)
          if (error.name !== 'TypeError' || !error.message.includes('fetch')) {
            setAddressError('Unable to fetch address suggestions. Please type the address manually.');
          } else {
            setAddressError(null); // Network errors are handled silently
          }
        }
      } finally {
        setAddressLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [addressQuery, mapboxToken]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const applyAddress = (feature) => {
    try {
      if (!feature || typeof feature !== 'object') {
        console.error('Invalid feature object:', feature);
        return;
      }
      
      const context = Array.isArray(feature.context) ? feature.context : [];
      const findContext = (prefix) => context.find((item) => item?.id?.startsWith(prefix));
      const city = findContext('place')?.text || '';
      const state = findContext('region')?.text || '';
      const zip = findContext('postcode')?.text || '';
      const addressLine = `${feature.address || ''} ${feature.text || ''}`.trim();

      setForm((prev) => ({
        ...prev,
        address: addressLine,
        city: city || prev.city,
        state: state || prev.state,
        zip_code: zip || prev.zip_code
      }));
      setAddressQuery(addressLine);
      setAddressResults([]);
      setAddressError(null);
    } catch (error) {
      console.error('Error applying address:', error);
      setAddressError('Error applying selected address. Please enter manually.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    
    setSaving(true);
    setSubmitError(null);
    
      try {
        if (!safeOnCreate) {
          throw new Error('onCreate callback is not provided');
        }
      
      const payload = {
        ...form,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        square_feet: form.square_feet ? Number(form.square_feet) : null
      };
      
      // Validate required fields
      if (!payload.address || !payload.city || !payload.state || !payload.zip_code) {
        throw new Error('Please fill in all required address fields');
      }
      
      // Call onCreate with error handling
      let result;
      try {
        result = await safeOnCreate(payload);
      } catch (createError) {
        console.error('Error in onCreate callback:', createError);
        throw new Error(createError?.message || 'Failed to create property. Please check your connection and try again.');
      }
      
      if (result?.success) {
        setForm({
          address: '',
          city: '',
          state: '',
          zip_code: '',
          unit_number: '',
          property_type: 'apartment',
          bedrooms: '',
          bathrooms: '',
          square_feet: '',
          description: ''
        });
        setAddressQuery('');
        setAddressResults([]);
        setAddressError(null);
        setSubmitError(null);
        safeOnClose();
      } else {
        const errorMessage = result?.error?.message || result?.error || 'Failed to create property. Please try again.';
        setSubmitError(errorMessage);
        console.error('Property creation failed:', result);
      }
    } catch (error) {
      console.error('Error submitting property form:', error);
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Add Property</h2>
              <p className="text-emerald-100 text-sm mt-1">Create a new property for your portfolio</p>
            </div>
            <button type="button" onClick={safeOnClose} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(event) => {
                    setAddressQuery(event.target.value);
                    setForm((prev) => ({ ...prev, address: event.target.value }));
                  }}
                  placeholder="742 Evergreen Terrace"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
                {mapboxToken && addressResults.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-auto">
                    {addressResults.map((feature) => (
                      <button
                        type="button"
                        key={feature.id}
                        onClick={() => applyAddress(feature)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50"
                      >
                        {feature.place_name}
                      </button>
                    ))}
                  </div>
                )}
                {mapboxToken && addressLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Searching...</div>
                )}
              </div>
              {!mapboxToken && (
                <p className="text-xs text-slate-500 mt-2">Add a map token to enable address autocomplete.</p>
              )}
              {addressError && (
                <p className="text-xs text-amber-600 mt-2">{addressError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <input
                type="text"
                value={form.city}
                onChange={handleChange('city')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <input
                type="text"
                value={form.state}
                onChange={handleChange('state')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={form.zip_code}
                onChange={handleChange('zip_code')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit Number (optional)</label>
              <input
                type="text"
                value={form.unit_number}
                onChange={handleChange('unit_number')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={form.property_type}
                  onChange={handleChange('property_type')}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms</label>
              <input
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={handleChange('bedrooms')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bathrooms</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.bathrooms}
                onChange={handleChange('bathrooms')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Square Feet</label>
              <input
                type="number"
                min="0"
                value={form.square_feet}
                onChange={handleChange('square_feet')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Optional details or amenities"
              />
            </div>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Home className="w-5 h-5" />
                Create Property
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyModal;
