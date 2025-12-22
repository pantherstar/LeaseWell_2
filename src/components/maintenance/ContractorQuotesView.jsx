import { useState, useEffect } from 'react';
import { Star, Phone, MapPin, CheckCircle, Clock, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

const ContractorQuotesView = ({ maintenanceRequest, quotes = [], loading = false, onSelectContractor, onDeployAgent }) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState(null);

  const agentStatus = maintenanceRequest?.agent_status;
  const hasQuotes = quotes && quotes.length > 0;

  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Ready to deploy
          </span>
        );
      case 'shopping':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Shopping for contractors...
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Quotes ready
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Agent failed
          </span>
        );
      default:
        return null;
    }
  };

  const handleSelectContractor = async (quoteId) => {
    if (!onSelectContractor) return;
    
    setSelecting(true);
    setSelectedQuoteId(quoteId);
    
    try {
      const result = await onSelectContractor(quoteId);
      if (result?.success) {
        setSelectedQuoteId(null);
      }
    } catch (error) {
      console.error('Error selecting contractor:', error);
    } finally {
      setSelecting(false);
    }
  };

  if (loading && !hasQuotes) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-3 text-slate-600">Loading quotes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Contractor Quotes</h3>
          <p className="text-sm text-slate-500 mt-1">
            {agentStatus === 'pending' && 'Deploy the agent to find contractors'}
            {agentStatus === 'shopping' && 'Agent is searching for contractors...'}
            {agentStatus === 'completed' && `${quotes.length} quote${quotes.length !== 1 ? 's' : ''} collected`}
            {agentStatus === 'failed' && 'The agent encountered an error'}
            {!agentStatus && 'No agent status'}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {agentStatus === 'pending' && (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">Ready to shop for contractors</p>
          <button
            onClick={onDeployAgent}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 mx-auto"
          >
            <Loader2 className="w-5 h-5" /> Deploy Agent
          </button>
        </div>
      )}

      {agentStatus === 'shopping' && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-slate-600">Searching for contractors and collecting quotes...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
        </div>
      )}

      {agentStatus === 'failed' && (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">The agent encountered an error</p>
          <button
            onClick={onDeployAgent}
            className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {agentStatus === 'completed' && hasQuotes && (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const isSelected = quote.status === 'accepted';
            const isRejected = quote.status === 'rejected';
            
            return (
              <div
                key={quote.id}
                className={`border-2 rounded-xl p-5 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : isRejected
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">{quote.contractor_name}</h4>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white">
                          Selected
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-400 text-white">
                          Not Selected
                        </span>
                      )}
                    </div>
                    
                    {quote.contractor_rating && (
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{quote.contractor_rating}</span>
                        {quote.contractor_review_count && (
                          <span className="text-slate-500">
                            ({quote.contractor_review_count} review{quote.contractor_review_count !== 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    )}

                    {quote.contractor_address && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{quote.contractor_address}</span>
                      </div>
                    )}

                    {quote.contractor_phone && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                        <Phone className="w-4 h-4" />
                        <span>{quote.contractor_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      ${quote.quote_amount?.toLocaleString()}
                    </div>
                    {quote.availability && (
                      <div className="text-xs text-slate-500">{quote.availability}</div>
                    )}
                  </div>
                </div>

                {quote.quote_notes && (
                  <p className="text-sm text-slate-600 mb-3">{quote.quote_notes}</p>
                )}

                {quote.negotiation_messages && quote.negotiation_messages.length > 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
                      className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {expandedQuote === quote.id ? 'Hide' : 'Show'} negotiation messages
                    </button>
                    
                    {expandedQuote === quote.id && (
                      <div className="mt-2 space-y-2 pl-4 border-l-2 border-amber-200">
                        {quote.negotiation_messages.map((msg, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium text-slate-700 mb-1">
                              {msg.role === 'sent' ? 'Sent:' : 'Received:'}
                            </div>
                            <div className="text-slate-600">{msg.message}</div>
                            {msg.timestamp && (
                              <div className="text-xs text-slate-400 mt-1">
                                {new Date(msg.timestamp).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!isSelected && !isRejected && (
                  <button
                    onClick={() => handleSelectContractor(quote.id)}
                    disabled={selecting && selectedQuoteId === quote.id}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {selecting && selectedQuoteId === quote.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Selecting...
                      </>
                    ) : (
                      'Select This Contractor'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {agentStatus === 'completed' && !hasQuotes && (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-slate-600">No quotes were collected</p>
          <p className="text-sm text-slate-500 mt-2">Try deploying the agent again</p>
        </div>
      )}
    </div>
  );
};

export default ContractorQuotesView;

