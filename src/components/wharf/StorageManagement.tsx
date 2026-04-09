import { useState, useEffect } from 'react';
import { Package, ThermometerSnowflake, FlaskConical, Box, AlertTriangle, Search, Loader2, Calendar } from 'lucide-react';
import api from '../../services/api';

// Defined based on new model schema
interface ContainerData {
  id: number;
  vessel_id: number;
  manifest_file_path: string;
  port_of_loading: string;
  arrival_date: string;
  description_of_goods: string;
  storage_type: 'chemical' | 'frozen' | 'dry';
  consignee_name: string;
  consignee_phone: string;
  status: string;
  arrival_notification?: {
    id: number;
    name: string;
  };
}

export function StorageManagement({ language }: { language: 'ar' | 'en' }) {
  const isRTL = language === 'ar';
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chemical' | 'frozen' | 'dry'>('chemical');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/wharf/containers');
      setContainers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContainers = containers.filter(c => 
    c.storage_type === activeTab &&
    (c.description_of_goods.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.consignee_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { id: 'chemical', icon: FlaskConical, label: isRTL ? 'المنطقة الكيميائية' : 'Chemical Storage', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'frozen', icon: ThermometerSnowflake, label: isRTL ? 'منطقة التجميد' : 'Frozen Storage', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'dry', icon: Box, label: isRTL ? 'التخزين الجاف' : 'Dry Storage', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  ] as const;

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl rtl-text-right' : 'ltr'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--secondary)]/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {isRTL ? 'إدارة تصنيف المخازن' : 'Categorical Engine'}
          </h2>
          <p className="text-[var(--text-secondary)] mt-1 max-w-2xl text-sm leading-relaxed">
            {isRTL 
              ? 'نظام توجيه آلي يقوم بفلترة وتوجيه أمان البضائع للمخازن الفنية (كيميائية و مبردة و جافة) بمجرد فك البيانات بالميناء.' 
              : 'Autonomously route incoming payloads into secure regional blocks matching their scanned payload parameters.'}
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder={isRTL ? "البحث برقم الهاتف أو التاجر..." : "Search goods or trader..."}
            className="w-full md:w-72 pl-10 pr-5 py-2.5 bg-[var(--bg-card)] border border-[var(--secondary)]/30 text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] shadow-sm text-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className={`w-4 h-4 text-[var(--text-secondary)] absolute top-3.5 ${isRTL ? 'right-4' : 'left-3.5'}`} />
        </div>
      </div>

      {/* Tri Tab Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 bg-[#f8fafc] dark:bg-[#1e293b]/50 rounded-xl overflow-hidden border border-[var(--secondary)]/10 shadow-inner">
        {tabs.map((tab) => {
          const count = containers.filter(c => c.storage_type === tab.id).length;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'chemical'|'frozen'|'dry')}
              className={`flex items-center justify-between sm:justify-center gap-3 py-3.5 px-4 rounded-lg text-sm font-bold transition-all ${
                isActive 
                  ? `bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)] border border-[var(--secondary)]/10 ring-1 ring-inset ${tab.id==='chemical'?'ring-amber-500/20':tab.id==='frozen'?'ring-cyan-500/20':'ring-slate-500/20'}` 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                 <tab.icon className={`w-5 h-5 ${isActive ? tab.color : 'opacity-50'}`} />
                 <span>{tab.label}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-black ${isActive ? tab.bg + ' ' + tab.color : 'bg-[var(--secondary)]/20'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categorical Results Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--secondary)]/20 rounded-2xl shadow-lg shadow-[var(--secondary)]/5 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className={`px-6 py-5 border-b border-[var(--secondary)]/10 flex justify-between items-center
          ${activeTab === 'chemical' ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''}
          ${activeTab === 'frozen' ? 'bg-cyan-500/5  border-l-4 border-l-cyan-500' : ''}
          ${activeTab === 'dry' ? 'bg-slate-500/5  border-l-4 border-l-slate-500' : ''}
        `}>
          <div className="flex gap-3 items-center">
              {activeTab === 'chemical' && <AlertTriangle className="w-5 h-5 text-amber-500 drop-shadow-sm" />}
              {activeTab === 'frozen' && <ThermometerSnowflake className="w-5 h-5 text-cyan-500 drop-shadow-sm" />}
              {activeTab === 'dry' && <Box className="w-5 h-5 text-slate-500 drop-shadow-sm" />}
              <h3 className="font-extrabold text-[var(--text-primary)] uppercase tracking-wider text-sm">
                {tabs.find(t => t.id === activeTab)?.label} Queue
              </h3>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-semibold">{filteredContainers.length} {isRTL ? 'وحدة' : 'Units'}</span>
        </div>

        {filteredContainers.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-[var(--secondary)]/40" />
            <h4 className="font-bold text-[var(--text-primary)] mb-1">{isRTL ? 'المنطقة خالية' : 'Block Clear'}</h4>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">{isRTL ? 'لا توجد حاويات تم تحليلها وتوجيهها للانتظار في هذه المنطقة حالياً.' : 'No payloads matching these categorical constraints are scheduled for storage handling.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] dark:bg-[#1e293b]/30 text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-[var(--secondary)]/10">{isRTL ? 'الارتباط الداخلي (السفينة)' : 'Vessel Anchor'}</th>
                  <th className="px-6 py-4 font-bold border-b border-[var(--secondary)]/10">{isRTL ? 'تحليل البضاعة' : 'Cargo Description'}</th>
                  <th className="px-6 py-4 font-bold border-b border-[var(--secondary)]/10">{isRTL ? 'بيانات التاجر' : 'Verified Consignee'}</th>
                  <th className="px-6 py-4 font-bold border-b border-[var(--secondary)]/10">{isRTL ? 'الجدولة' : 'Logistics'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--secondary)]/5 text-sm">
                {filteredContainers.map(container => (
                  <tr key={container.id} className="hover:bg-[var(--primary)]/5 transition-colors group">
                    <td className="px-6 py-4 align-top">
                       <span className="font-bold text-[var(--primary)]">{container.arrival_notification?.name || 'Unknown Vessel'}</span>
                    </td>
                    <td className="px-6 py-4 align-top max-w-[250px]">
                       <span className="text-[var(--text-primary)] font-medium block leading-snug">{container.description_of_goods}</span>
                    </td>
                    <td className="px-6 py-4 align-top">
                       <span className="font-bold text-[var(--text-primary)] block bg-[var(--secondary)]/10 w-fit px-2 py-0.5 rounded text-xs mb-1">{container.consignee_name}</span>
                       <span className="text-xs font-semibold text-[var(--text-secondary)]">{container.consignee_phone}</span>
                    </td>
                    <td className="px-6 py-4 align-top">
                       <div className="flex flex-col gap-1.5">
                           <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {container.arrival_date}</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
