import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Anchor, Clock, Ship, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface WharfAvailabilityProps {
  language: Language;
}

import { wharfService } from '../../services/wharfService';

interface Wharf {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;
  vessels?: { name: string }[];
}

export function WharfAvailability({ language }: WharfAvailabilityProps) {
  const isRTL = language === 'ar';
  const [wharves, setWharves] = useState<Wharf[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const loadWharves = async () => {
    setLoading(true);
    try {
      const data = await wharfService.getWharves();
      setWharves(data);
    } catch (error) {
      console.error('Error loading wharves:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async (wharf: Wharf) => {
    setProcessing(wharf.id);
    try {
      const newStatus = wharf.status === 'maintenance' ? 'available' : 'maintenance';
      await wharfService.updateWharfStatus(wharf.id.toString(), newStatus);
      await loadWharves();
    } catch (error) {
      console.error('Error updating status', error);
      alert('Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  // Removed handleApprove and handleReject as we are now managing status directly

  useEffect(() => {
    loadWharves();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRTL ? 'توفر الأرصفة' : 'Wharf Availability'}
          </h1>
          <p className="text-blue-200">
            {isRTL ? 'إدارة توفر الأرصفة' : 'Manage Wharf Availability'}
          </p>
        </div>
        <button
          onClick={loadWharves}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        ) : wharves.map(wharf => (
          <div key={wharf.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{wharf.name}</h3>
                <p className="text-blue-200 text-sm">Capacity: {wharf.capacity}</p>
              </div>
              <Anchor className={`w-8 h-8 ${wharf.status === 'available' ? 'text-green-400' : wharf.status === 'maintenance' ? 'text-amber-400' : 'text-red-400'}`} />
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-1">{isRTL ? 'الحالة' : 'Status'}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${wharf.status === 'available' ? 'bg-green-500/20 text-green-300' :
                  wharf.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                }`}>
                {wharf.status}
              </span>
            </div>

            <button
              onClick={() => toggleMaintenance(wharf)}
              disabled={processing === wharf.id || wharf.status === 'occupied'}
              className={`w-full py-2 rounded-xl font-semibold transition-all ${wharf.status === 'maintenance'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {processing === wharf.id ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> :
                wharf.status === 'maintenance' ? (isRTL ? 'إتاحة الرصيف' : 'Set Available') : (isRTL ? 'وضع صيانة' : 'Set Maintenance')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
