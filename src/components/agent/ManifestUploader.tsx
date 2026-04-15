import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, XCircle, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface ContainerData {
  id: number;
  port_of_loading: string;
  storage_type: string;
  consignee_name: string;
  manifest_file_path: string;
  extraction_status?: 'pending' | 'extracted' | 'incomplete' | 'failed' | string;
  extraction_errors?: string[] | null;
  error_reason?: string | null;
}

interface ManifestUploaderProps {
  vesselId: number | string;
  language: 'ar' | 'en';
  onUploadSuccess?: (containers: ContainerData[]) => void;
}

export function ManifestUploader({ vesselId, language, onUploadSuccess }: ManifestUploaderProps) {
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContainers, setExtractedContainers] = useState<ContainerData[]>([]);
  const [uploadErrors, setUploadErrors] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setUploadErrors([]); // Clear errors when initiating a new upload
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error(isRTL ? 'يرجى تحديد ملف واحد على الأقل' : 'Please select at least one file');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('manifests[]', file);
      });

      const response = await api.post(`/arrival-notifications/${vesselId}/manifests`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(isRTL ? 'تم الرفع ومعالجة الملفات بنجاح!' : 'Files uploaded and processed successfully!');
      
      const successfulUploads = response.data.successful_uploads || response.data.results || [];
      const failedUploads = response.data.failed_uploads || [];

      const flattenedContainers = successfulUploads.map((r: any) => ({
        ...r.container,
        extraction_status: r.extraction_status,
        extraction_errors: r.extraction_errors,
        error_reason: r.error_reason
      }));

      // Update state arrays
      setExtractedContainers(flattenedContainers);
      setUploadErrors(failedUploads);
      setSelectedFiles([]); // clear after successful upload
      
      if (onUploadSuccess) {
        onUploadSuccess(flattenedContainers);
      }
    } catch (error: any) {
      console.error(error);
      const limitMsg = error.response?.status === 413 ? (isRTL ? 'حجم الملفات كبير جداً.' : 'Files are too large.') : '';
      toast.error(isRTL ? 'فشل في رفع ومعالجة الملفات. ' + limitMsg : 'Failed to upload and parse manifests. ' + limitMsg);
    } finally {
      setIsUploading(false);
      // Reset physical input node so we can upload same files again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteManifest = async (id: number) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا البيان؟' : 'Are you sure you want to delete this manifest?')) return;

    try {
      await api.delete(`/agent/manifests/${id}`);
      setExtractedContainers(prev => prev.filter(c => c.id !== id));
      toast.info(isRTL ? 'تم حذف البيان بنجاح' : 'Manifest record deleted successfully');
    } catch (error) {
      toast.error(isRTL ? 'فشل حذف البيان' : 'Failed to delete manifest');
    }
  };

  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--secondary)]/30 rounded-xl p-6 ${isRTL ? 'rtl rtl-text-right' : 'ltr'} shadow-sm`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">
          {isRTL ? 'رفع ملفات بيان الحمولة' : 'Upload Cargo Manifests'}
        </h3>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {isRTL 
            ? 'قم برفع ملفات PDF أو الصور المتعددة لبيانات الحمولة. ستقوم الأنظمة باستخراج البيانات تلقائياً.' 
            : 'Upload multiple PDF or Image manifests. The system will autonomously extract payload categorizations.'}
        </p>
      </div>

      {uploadErrors.length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-5 rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <strong className="text-red-500 font-semibold">{isRTL ? 'وثائق مرفوضة (لم يتم رفعها)' : 'Rejected Documents (Not Saved)'}</strong>
            <span className="text-red-400 text-sm">({uploadErrors.length})</span>
          </div>
          <ul className="space-y-3">
            {uploadErrors.map((err, i) => (
              <li key={i} className="bg-[var(--bg-card)] border border-red-500/20 rounded-lg p-3 text-sm shadow-sm">
                 <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                       <span className="text-[var(--text-primary)] font-semibold block mb-1">{err.file_name}</span>
                       <span className="text-red-400 text-xs font-medium">{err.error_reason}</span>
                    </div>
                 </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {extractedContainers.length === 0 && (
        <div className="space-y-6">
          {/* File Picker Area */}
          <div 
            className="border-2 border-dashed border-[var(--secondary)] rounded-xl p-10 flex flex-col items-center justify-center bg-[var(--bg-primary)]/50 hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/50 transition-colors cursor-pointer group shadow-inner"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-12 h-12 text-[var(--text-secondary)] group-hover:text-[var(--primary)] mb-4 transition-colors" />
            <h4 className="text-[var(--text-primary)] font-medium mb-1">
              {isRTL ? 'انقر أو اسحب الملفات هنا' : 'Click to select or drag manifests here'}
            </h4>
            <p className="text-[var(--text-secondary)] text-xs text-center max-w-sm">
              {isRTL ? 'يدعم صيغ: PDF, JPG, PNG' : 'Supports: PDF, JPG, PNG'}
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              multiple 
              accept=".pdf,.png,.jpeg,.jpg"
              onChange={handleFileChange}
            />
          </div>

          {/* Selected Files Preview List */}
          {selectedFiles.length > 0 && (
            <div className="bg-[var(--bg-primary)]/30 p-5 border border-[var(--secondary)]/20 rounded-xl">
              <h5 className="text-sm font-semibold text-[var(--text-primary)] mb-4 pb-2 border-b border-[var(--secondary)]/20">
                {isRTL ? 'الملفات المحددة:' : 'Selected Manifests Queue:'}
              </h5>
              <ul className="space-y-2 mb-5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedFiles.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--secondary)]/30 rounded-lg py-2.5 px-4 text-sm shadow-sm transition-all hover:border-[var(--primary)]/30">
                    <div className="flex items-center gap-3 truncate">
                      <FileText className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                      <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]" title={f.name}>{f.name}</span>
                      <span className="text-[var(--text-secondary)] text-xs">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)} 
                      className="text-red-400/80 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-all active:scale-95"
                      title={isRTL ? 'إزالة' : 'Remove'}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end pt-3 border-t border-[var(--secondary)]/20">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-blue-600 hover:to-blue-500 active:scale-[0.98] text-white rounded-lg font-semibold transition-all shadow-lg shadow-[var(--primary)]/25 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isRTL ? 'جاري الاستخراج...' : 'Crunching OCR...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {isRTL ? 'استخراج وتحليل البيانات' : 'Authenticate & Process Data'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table (Shows independently after successful upload) */}
      {extractedContainers.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
           <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
             <div className="bg-emerald-500/20 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
             </div>
             <div className="text-emerald-500 text-sm">
               <strong className="block font-semibold text-base mb-0.5">
                 {isRTL ? 'نجاح الاستخراج الآلي' : 'Autonomous Parsing Completed'}
               </strong>
               <span className="opacity-90">
                {isRTL 
                  ? `تم بنجاح تحليل وتسجيل ${extractedContainers.length} حاويات من المستندات.`
                  : `Securely verified and bridged ${extractedContainers.length} payload packages directly into the active Arrival Notification.`}
               </span>
             </div>
           </div>

           <div className="overflow-hidden rounded-xl border border-[var(--secondary)]/30 ring-1 ring-black/5 shadow-md">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-card)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 font-semibold border-b border-[var(--secondary)]/20">{isRTL ? 'المستند' : 'Source'}</th>
                    <th className="px-5 py-4 font-semibold border-b border-[var(--secondary)]/20">{isRTL ? 'ميناء الشحن' : 'Loading Port'}</th>
                    <th className="px-5 py-4 font-semibold border-b border-[var(--secondary)]/20">{isRTL ? 'المُرسل إليه' : 'Consignee'}</th>
                    <th className="px-5 py-4 font-semibold border-b border-[var(--secondary)]/20">{isRTL ? 'الحالة والفئة' : 'Status & Category'}</th>
                    <th className="px-5 py-4 font-semibold border-b border-[var(--secondary)]/20 text-center">{isRTL ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--secondary)]/10 bg-[var(--bg-primary)]/40">
                  {extractedContainers.map((container, idx) => {
                    const isFailed = container.extraction_status === 'failed' || container.extraction_status === 'incomplete';
                    return (
                      <tr key={idx} className={`hover:bg-[var(--bg-card)] transition-colors text-sm text-[var(--text-primary)] ${isFailed ? 'bg-red-500/5' : ''}`}>
                         <td className="px-5 py-4 truncate max-w-[180px]" title={container.manifest_file_path}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {isFailed ? (
                                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                )}
                                <span className={`truncate ${isFailed ? 'text-red-400 font-semibold' : ''}`}>
                                  {container.manifest_file_path.split('/').pop()}
                                </span>
                              </div>
                              {isFailed && container.error_reason && (
                                <div className="mt-1 flex flex-col gap-1">
                                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2 mt-1">
                                      <span className="text-[11px] text-red-500 font-bold uppercase flex items-center gap-1 mb-0.5">
                                        <AlertCircle className="w-3 h-3" />
                                        {isRTL ? 'خطأ في الاستخراج' : 'Extraction Error'}
                                      </span>
                                      <p className="text-[10px] text-red-400 font-medium leading-tight">
                                        {container.error_reason}
                                      </p>
                                  </div>
                                </div>
                              )}
                            </div>
                         </td>
                         <td className="px-5 py-4 text-[var(--text-secondary)]">{container.port_of_loading || '---'}</td>
                         <td className="px-5 py-4 font-medium text-[var(--text-primary)]">{container.consignee_name || '---'}</td>
                         <td className="px-5 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase
                                ${container.extraction_status === 'extracted' || container.extraction_status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                              `}>
                                {container.extraction_status}
                              </span>
                              <span className={`inline-flex items-center w-fit px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase
                                ${container.storage_type === 'chemical' ? 'bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30' : ''}
                                ${container.storage_type === 'frozen' ? 'bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/30' : ''}
                                ${container.storage_type === 'dry' ? 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/30' : ''}
                              `}>
                                {container.storage_type}
                              </span>
                            </div>
                         </td>
                         <td className="px-5 py-4 text-center">
                           <button 
                             onClick={() => handleDeleteManifest(container.id)}
                             className="text-[var(--text-secondary)] hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 mb-1.5 transition-all text-sm active:scale-95"
                             title={isRTL ? 'حذف' : 'Delete'}
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                         </td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
           </div>

           <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setExtractedContainers([])}
                className="flex items-center gap-2 px-5 py-2.5 border border-[var(--secondary)]/40 text-[var(--text-primary)] font-medium rounded-lg hover:bg-[var(--secondary)]/10 hover:border-[var(--secondary)]/60 transition-all text-sm active:scale-95"
              >
                 <UploadCloud className="w-4 h-4" />
                 {isRTL ? 'رفع الدفعة التالية' : 'Upload Another Batch'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
