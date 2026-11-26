import React, { useMemo, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { ExclusionRules, SellerLead, VerticalId } from '../types/os';
import { VERTICALS } from '../data/verticals';
import { parseLeadsCsv } from '../utils/outreachEngine';

const SAMPLE_CSV = `company,vertical,owner,email,city,state,founded,revenue,ebitda,realestate,credential,source
Apex Cold Storage Doors LLC,dock_door,Martin Cole,mcole@apexcolddoors.example,Columbus,OH,1990,9.5,1.9,yes,IDA Commercial · Rytec Dealer,IDA Directory
Great Plains Kitchen Equipment Service,cfesa_kitchen,Harold Jennings,hjennings@gpkitchen.example,Kansas City,MO,1988,7.4,1.45,yes,CFESA Master · Hobart ASA,CFESA Master Directory
Generic Role Inbox Shop,dock_door,Sarah West,info@genericroleshop.example,Dallas,TX,1993,5.2,0.9,no,Commercial Door Sub,Manual List`;

interface CsvImportModalProps {
  existingLeads: SellerLead[];
  exclusions: ExclusionRules;
  onImport: (newLeads: SellerLead[]) => void;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  existingLeads,
  exclusions,
  onImport,
  onClose,
}) => {
  const [verticalId, setVerticalId] = useState<VerticalId>('dock_door');
  const [rawCsv, setRawCsv] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!rawCsv.trim()) return null;
    return parseLeadsCsv(rawCsv, verticalId, existingLeads, exclusions);
  }, [rawCsv, verticalId, existingLeads, exclusions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawCsv(String(reader.result || ''));
      setValidationError(null);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (!rawCsv.trim()) {
      setValidationError('Paste CSV rows or upload a .csv file before importing.');
      return;
    }
    if (!preview || preview.validLeads.length === 0) {
      setValidationError('No valid, non-role-inbox leads found to import.');
      return;
    }
    onImport(preview.validLeads);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import Leads CSV"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F2342]">
              Bulk CSV Lead Importer &amp; Deliverability Gatekeeper
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Ingest scraped CFESA, IDA, TCEQ, or A2LA registries. Automatically blocks role inboxes, duplicates, and exclusions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close CSV import modal"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="csv-vertical-select"
                className="block text-xs font-semibold text-slate-700"
              >
                Assign Target Vertical
              </label>
              <select
                id="csv-vertical-select"
                value={verticalId}
                onChange={(e) => setVerticalId(e.target.value as VerticalId)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              >
                {VERTICALS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.rank}. {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                Upload .csv File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setRawCsv(SAMPLE_CSV);
                  setValidationError(null);
                }}
                className="rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-[#0F2342] hover:bg-slate-100"
              >
                Load Sample Registry CSV
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="csv-raw-textarea"
              className="block text-xs font-semibold text-slate-700"
            >
              Raw CSV (Headers: company, owner, email, city, state, founded, revenue, ebitda, realestate)
            </label>
            <textarea
              id="csv-raw-textarea"
              rows={6}
              value={rawCsv}
              onChange={(e) => {
                setRawCsv(e.target.value);
                setValidationError(null);
              }}
              placeholder="company,owner,email,city,state,founded,revenue,ebitda,realestate"
              className="mt-1 w-full rounded-md border border-slate-300 p-3 font-mono text-xs text-slate-900 focus:border-[#0F2342] focus:outline-none"
            />
          </div>

          {validationError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {validationError}
            </div>
          )}

          {preview && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-4 text-xs">
                <span className="font-semibold text-emerald-700 font-mono">
                  {preview.validLeads.length} Ready to Import
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-amber-700 font-mono">
                  {preview.rejectedRows.length} Blocked by Guardrails
                </span>
              </div>

              {preview.rejectedRows.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="font-semibold">Rejected Rows</div>
                  <ul className="mt-1 space-y-1">
                    {preview.rejectedRows.map((r) => (
                      <li key={`${r.rowNumber}-${r.email}`}>
                        Row {r.rowNumber} ({r.company} · {r.email}): {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461]"
          >
            Import {preview ? `${preview.validLeads.length} ` : ''}Verified Leads
          </button>
        </div>
      </div>
    </div>
  );
};
