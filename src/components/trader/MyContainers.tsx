import React, { useState, useEffect } from 'react';
import { Language } from '../../App';
import { Package, Ship, MapPin, RefreshCw, Search, Filter } from 'lucide-react';
import { traderService } from '../../services/traderService';

interface MyContainersProps {
  language: Language;
  userEmail: string;
}

interface Container {
  id: string;
  containerId: string;
  vesselName: string;
  type: string;
  status: string;
  assignedStorage: string | null;
  weight: number;
  arrivalDate: string;
}

export function MyContainers({ language, userEmail }: MyContainersProps) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadContainers = async () => {
    setLoading(true);
    try {
      const data = await traderService.getContainers();

      // Map data if necessary. Backend returns containers with manifest.vessel relation.
      // Need to flatten structure to match interface or update interface.
      // Interface: { id, containerId, vesselName, type, status, assignedStorage, weight, arrivalDate }
      const mappedContainers = data.map((c: any) => ({
        id: c.id.toString(),
        containerId: c.id.toString(),
        vesselName: c.manifest?.vessel?.name || 'Unknown',
        type: 'general', // Mock or c.type
        status: c.status,
        assignedStorage: c.location,
        weight: 10, // Mock
        arrivalDate: c.created_at || new Date().toISOString()
      }));

      setContainers(mappedContainers);
    } catch (error) {
      console.error('Error loading containers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContainers();
  }, [userEmail]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'arrived':
        return {
          label: isRTL ? 'وصلت' : 'Arrived',
          bg: 'bg-blue-500/20',
          border: 'border-blue-400/30',
          text: 'text-blue-300'
        };
      case 'assigned':
        return {
          label: isRTL ? 'مخزنة' : 'Stored',
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-400/30',
          text: 'text-emerald-300'
        };
      case 'ready_discharge':
        return {
          label: isRTL ? 'جاهزة للتفريغ' : 'Ready for Discharge',
          bg: 'bg-teal-500/20',
          border: 'border-teal-400/30',
          text: 'text-teal-300'
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500/20',
          border: 'border-gray-400/30',
          text: 'text-gray-300'
        };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      general: isRTL ? 'عامة' : 'General',
      refrigerated: isRTL ? 'مبردة' : 'Refrigerated',
      bulk: isRTL ? 'بضائع سائبة' : 'Bulk',
      hazardous: isRTL ? 'خطرة' : 'Hazardous'
    };
    return labels[type] || type;
  };

  const filteredContainers = containers.filter(container => {
    const matchesSearch =
      container.containerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.vesselName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || container.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isRTL ? 'حاوياتي' : 'My Containers'}
            </h1>
            <p className="text-emerald-200/70">
              {isRTL ? 'عرض وإدارة جميع الحاويات الخاصة بك' : 'View and manage all your containers'}
            </p>
          </div>
          <button
            onClick={loadContainers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">{isRTL ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
            <input
              type="text"
              placeholder={isRTL ? 'ابحث عن حاوية أو سفينة...' : 'Search by container or vessel...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-emerald-400/50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-400/50 appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
              <option value="arrived">{isRTL ? 'وصلت' : 'Arrived'}</option>
              <option value="assigned">{isRTL ? 'مخزنة' : 'Stored'}</option>
              <option value="ready_discharge">{isRTL ? 'جاهزة للتفريغ' : 'Ready for Discharge'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-blue-200/60 text-sm mb-1">{isRTL ? 'إجمالي الحاويات' : 'Total Containers'}</div>
          <div className="text-2xl font-bold text-white">{containers.length}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-emerald-200/60 text-sm mb-1">{isRTL ? 'مخزنة' : 'Stored'}</div>
          <div className="text-2xl font-bold text-white">
            {containers.filter(c => c.status === 'assigned').length}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="text-teal-200/60 text-sm mb-1">{isRTL ? 'جاهزة للتفريغ' : 'Ready for Discharge'}</div>
          <div className="text-2xl font-bold text-white">
            {containers.filter(c => c.status === 'ready_discharge').length}
          </div>
        </div>
      </div>

      {/* Containers Table */}
      {loading ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">{isRTL ? 'جاري التحميل...' : 'Loading containers...'}</p>
        </div>
      ) : filteredContainers.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-blue-300 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {isRTL ? 'لم يتم العثور على حاويات' : 'No Containers Found'}
          </h3>
          <p className="text-blue-200/60">
            {isRTL ? 'لا توجد حاويات تطابق معايير البحث' : 'No containers match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-sm font-semibold text-emerald-300`}>
                    {isRTL ? 'رقم الحاوية' : 'Container ID'}
                  </th>
                  <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-sm font-semibold text-emerald-300`}>
                    {isRTL ? 'السفينة' : 'Vessel'}
                  </th>
                  <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-sm font-semibold text-emerald-300`}>
                    {isRTL ? 'موقع التخزين' : 'Storage Location'}
                  </th>
                  <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-sm font-semibold text-emerald-300`}>
                    {isRTL ? 'النوع' : 'Type'}
                  </th>
                  <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-sm font-semibold text-emerald-300`}>
                    {isRTL ? 'الحالة' : 'Status'}
                  </th>
                  <th className={`px-6 py-4 text-${isRTL ? 'right' : 'left'} text-sm font-semibold text-emerald-300`}>
                    {isRTL ? 'تاريخ الوصول' : 'Arrival Date'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredContainers.map((container) => {
                  const statusBadge = getStatusBadge(container.status);

                  return (
                    <tr key={container.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-300" />
                          <span className="font-medium text-white">{container.containerId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4 text-blue-300" />
                          <span className="text-blue-200">{container.vesselName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {container.assignedStorage ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-300" />
                            <span className="text-teal-200">{container.assignedStorage}</span>
                          </div>
                        ) : (
                          <span className="text-blue-200/40">{isRTL ? 'في الانتظار' : 'Awaiting'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-200">{getTypeLabel(container.type)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg ${statusBadge.bg} border ${statusBadge.border} ${statusBadge.text} text-sm font-medium`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-blue-200">
                        {formatDate(container.arrivalDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          {isRTL ? 'دليل الحالة' : 'Status Legend'}
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-blue-200 text-sm">{isRTL ? 'وصلت: وصلت إلى الميناء' : 'Arrived: At port'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <span className="text-emerald-200 text-sm">{isRTL ? 'مخزنة: تم تعيين موقع' : 'Stored: Location assigned'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
            <span className="text-teal-200 text-sm">{isRTL ? 'جاهزة: جاهزة للتفريغ' : 'Ready: Can be discharged'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
