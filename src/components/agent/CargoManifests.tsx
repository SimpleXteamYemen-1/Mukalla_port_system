import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle2, XCircle, Clock, AlertCircle, Download, Eye, Loader2 } from 'lucide-react';
import { agentService, CargoManifest, Vessel } from '../../services/agentService';
import { Language } from '../../App';
import { translations } from '../../utils/translations';

interface CargoManifestsProps {
  language: Language;
}

export function CargoManifests({ language }: CargoManifestsProps) {
  const t = translations[language]?.agent?.manifests || translations.en.agent.manifests;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState('');

  // New state for dynamic data
  const [manifests, setManifests] = useState<CargoManifest[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [containerCount, setContainerCount] = useState('');
  const [totalWeight, setTotalWeight] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [manifestsData, vesselsData] = await Promise.all([
        agentService.getManifests(),
        agentService.getVessels()
      ]);
      setManifests(manifestsData);
      setVessels(vesselsData);
    } catch (error) {
      console.error('Failed to load manifests data', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed static containerSummary and vessels array (using fetched data)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />;
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 border-green-400/30 text-green-200';
      case 'rejected':
        return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'pending':
        return 'bg-amber-500/20 border-amber-400/30 text-amber-200';
      default:
        return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      approved: { ar: 'موافق', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      pending: { ar: 'قيد المراجعة', en: 'Under Review' },
    };
    return labels[status]?.[language] || status;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-blue-200">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
        >
          <Upload className="w-5 h-5" />
          {t.uploadManifest}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="text-blue-300 text-sm mb-1">{t.totalManifests}</div>
          <div className="text-2xl font-bold text-white">{manifests.length}</div>
        </div>
        <div className="bg-green-500/10 backdrop-blur-xl rounded-xl border border-green-400/30 p-4">
          <div className="text-green-300 text-sm mb-1">{t.approved}</div>
          <div className="text-2xl font-bold text-white">
            {manifests.filter(m => m.status === 'approved').length}
          </div>
        </div>
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl border border-amber-400/30 p-4">
          <div className="text-amber-300 text-sm mb-1">{t.pending}</div>
          <div className="text-2xl font-bold text-white">
            {manifests.filter((m: any) => m.status === 'pending').length}
          </div>
        </div>
        <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-400/30 p-4">
          <div className="text-red-300 text-sm mb-1">{t.rejected}</div>
          <div className="text-2xl font-bold text-white">
            {manifests.filter((m: any) => m.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1628] rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">{t.uploadManifest}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.selectVessel}</label>
                <select
                  value={selectedVessel}
                  onChange={(e) => setSelectedVessel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-green-400 transition-all"
                >
                  <option value="">{t.selectVesselPlaceholder}</option>
                  {vessels.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.uploadFile}</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-green-400/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                  <p className="text-white text-sm mb-1">{selectedFile ? selectedFile.name : t.dragDrop}</p>
                  <p className="text-blue-300 text-xs">{t.fileFormats}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t.containers}</label>
                  <input
                    type="number"
                    value={containerCount}
                    onChange={(e) => setContainerCount(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-green-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">{t.totalWeight}</label>
                  <input
                    type="number"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-green-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  if (!selectedVessel || !selectedFile || !containerCount || !totalWeight) {
                    alert("Please fill all fields");
                    return;
                  }

                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('vessel_id', selectedVessel); // selectedVessel is ID or name? Form uses ID if option value is v.id
                    formData.append('file', selectedFile);
                    formData.append('total_weight', totalWeight);
                    formData.append('container_count', containerCount);

                    await agentService.uploadManifest(formData);

                    alert(language === 'ar' ? 'تم رفع البيان بنجاح!' : 'Manifest uploaded successfully!');
                    setShowUploadModal(false);
                    setSelectedVessel('');
                    setSelectedFile(null);
                    setContainerCount('');
                    setTotalWeight('');
                    loadData(); // Refresh list
                  } catch (error) {
                    console.error("Upload failed", error);
                    alert("Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={!selectedVessel || uploading}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.upload}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedVessel('');
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white transition-all"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-blue-200 py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : manifests.length === 0 ? (
          <div className="text-center text-blue-200 py-8 border border-white/10 rounded-2xl bg-white/5">
            No manifests found.
          </div>
        ) : manifests.map((manifest: any) => (
          <div key={manifest.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  {getStatusIcon(manifest.status)}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{manifest.vessel?.name || 'Unknown Vessel'}</h3>
                  <p className="text-blue-300 text-sm">{t.manifestId}: {manifest.id}</p>
                </div>
              </div>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(manifest.status)}`}>
                {getStatusLabel(manifest.status)}
              </span>
            </div>

            {/* Manifest Info Grid */}
            <div className="grid md:grid-cols-5 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.uploadDate}</div>
                <div className="text-white font-medium text-sm">{manifest.uploadDate}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.containers}</div>
                <div className="text-white font-medium text-sm">{manifest.containers}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.totalWeight}</div>
                <div className="text-white font-medium text-sm">{manifest.totalWeight}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">{t.fileSize}</div>
                <div className="text-white font-medium text-sm">{manifest.file_size || 'Unknown'}</div>
              </div>
              {manifest.approvedBy && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-blue-300 text-xs mb-1">{t.approvedBy}</div>
                  <div className="text-white font-medium text-sm">{manifest.approvedBy}</div>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {/* Rejection Reason - Backend 'rejected' status handling if details available */}
            {manifest.status === 'rejected' && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-200 font-semibold text-sm mb-1">{t.rejectionReason}</div>
                    <div className="text-red-200/80 text-sm mb-1">Check logs for details</div>
                  </div>
                </div>
              </div>
            )}

            {/* Container Summary - Simplified as backend doesn't provide breakdown yet */}

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-200 hover:text-white transition-all">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{t.view}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-200 hover:text-white transition-all">
                <Download className="w-4 h-4" />
                <span className="text-sm">{t.download}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
