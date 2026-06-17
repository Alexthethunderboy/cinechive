'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { processLetterboxdImportAction, ImportRow } from '@/app/actions/import-actions';

export default function LetterboxdImporter() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ successful: number; failed: number; errors: string[] } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file (e.g. watched.csv or diary.csv)');
      return;
    }

    setIsUploading(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as ImportRow[];
          if (!rows.length) {
            toast.error('No data found in the CSV.');
            setIsUploading(false);
            return;
          }

          toast.info(`Found ${rows.length} entries. Import started... this may take a few minutes for large files.`);

          // We'll process up to 1000 items at a time to prevent server timeout
          // A more robust implementation would stream this or use a background job
          const dataToProcess = rows.slice(0, 1000); 
          if (rows.length > 1000) {
            toast.warning(`Only importing the first 1000 entries to prevent timeouts.`);
          }

          const response = await processLetterboxdImportAction(dataToProcess);

          if ('error' in response && response.error) {
            toast.error(response.error);
          } else {
            const successResp = response as { successful: number; failed: number; errors: string[] };
            setResults({
              successful: successResp.successful || 0,
              failed: successResp.failed || 0,
              errors: successResp.errors || []
            });
            if (successResp.failed && successResp.failed > 0) {
              toast.warning(`Import complete. ${successResp.successful} succeeded, ${successResp.failed} failed.`);
            } else {
              toast.success(`Successfully imported ${successResp.successful} entries!`);
            }
          }
        } catch (error) {
          toast.error('An error occurred during import.');
          console.error(error);
        } finally {
          setIsUploading(false);
          // Reset file input
          event.target.value = '';
        }
      },
      error: (error) => {
        toast.error('Failed to parse CSV file: ' + error.message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <UploadCloud className="text-vibe-cyan" size={20} />
            Letterboxd Import
          </h4>
          <p className="text-white/40 text-sm mt-1">Upload your Letterboxd <code>watched.csv</code> or <code>diary.csv</code> to import your history.</p>
        </div>
        
        <div>
          <input 
            type="file" 
            id="letterboxd-csv-upload" 
            className="hidden" 
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <button 
            onClick={() => document.getElementById('letterboxd-csv-upload')?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-vibe-cyan/10 border border-vibe-cyan/20 text-vibe-cyan font-heading font-bold hover:bg-vibe-cyan/20 transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {isUploading ? 'Importing...' : 'Select CSV'}
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm animate-pulse flex items-center gap-3">
          <Loader2 size={16} className="animate-spin" />
          Processing import... Searching TMDB to match your movies. Please don't close this page.
        </div>
      )}

      {results && (
        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
          <h5 className="text-white font-bold mb-3 text-sm">Import Results</h5>
          <div className="flex gap-6 text-sm mb-4">
            <span className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={16} /> {results.successful} Imported
            </span>
            {results.failed > 0 && (
               <span className="flex items-center gap-2 text-rose-400 font-bold">
                 <XCircle size={16} /> {results.failed} Failed
               </span>
            )}
          </div>
          
          {results.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Errors log</p>
              <ul className="text-xs text-rose-300/70 max-h-32 overflow-y-auto space-y-1 bg-black/50 p-3 rounded-lg font-mono">
                {results.errors.slice(0, 50).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {results.errors.length > 50 && (
                  <li>...and {results.errors.length - 50} more errors.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
