import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SellerLead, VerticalId } from '../types/os';
import { VERTICALS, VERTICAL_MAP } from '../data/verticals';
import { isDirectNamedEmail, normalizeDomain } from '../utils/outreachEngine';

interface AddLeadModalProps {
  onAdd: (lead: SellerLead) => void;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ onAdd, onClose }) => {
  const [company, setCompany] = useState('');
  const [verticalId, setVerticalId] = useState<VerticalId>('dock_door');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('OH');
  const [foundedYear, setFoundedYear] = useState('1991');
  const [estRevenueM, setEstRevenueM] = useState('7.5');
  const [estEbitdaM, setEstEbitdaM] = useState('1.5');
  const [ownsRealEstate, setOwnsRealEstate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !ownerName.trim() || !email.trim() || !city.trim()) {
      setError('Company, owner name, direct email, and city are required.');
      return;
    }
    if (!isDirectNamedEmail(email)) {
      setError('Use a direct personal owner email (role inboxes like info@ or service@ are blocked).');
      return;
    }
    const rev = Number(estRevenueM);
    const ebitda = Number(estEbitdaM);
    const yr = Number(foundedYear);
    if (Number.isNaN(rev) || rev <= 0 || Number.isNaN(ebitda) || ebitda <= 0) {
      setError('Estimated revenue and EBITDA must be positive numbers.');
      return;
    }

    const domain = normalizeDomain(email.split('@')[1] || '');
    const vertical = VERTICAL_MAP[verticalId];
    onAdd({
      id: `lead-${Date.now()}`,
      company: company.trim(),
      verticalId,
      city: city.trim(),
      state: state.trim().toUpperCase().slice(0, 2) || 'US',
      website: `https://${domain}`,
      domain,
      ownerName: ownerName.trim(),
      ownerTitle: 'Owner / Founder',
      email: email.trim(),
      emailVerification: 'Verified',
      recipientEsp: email.toLowerCase().endsWith('@gmail.com') ? 'Google' : 'Microsoft365',
      foundedYear: yr || 1992,
      estRevenueM: rev,
      estEbitdaM: ebitda,
      teamSize: '15-35 employees',
      ownsRealEstate,
      credentialTag: vertical.credentialLabel,
      dataSource: 'Manual Research',
      dealKillerFlags: [],
      signals: {
        founded1996OrEarlier: yr <= 1996,
        livingFounderStillOwner: true,
        thirtyPlusYearTrackRecord: new Date().getFullYear() - yr >= 30,
        familyOwnedNoSuccessorNamed: true,
        smallFounderRunTeam: true,
        founderNameInCompany: company
          .toLowerCase()
          .includes(ownerName.trim().split(/\s+/).slice(-1)[0].toLowerCase()),
        nextGenAlreadyInCharge: false,
      },
      stage: 'Ready',
      notes: 'Added via single-lead intake.',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add Off-Market Target"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[#0F2342]">
            Add Off-Market Target
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add target modal"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="add-company" className="block text-xs font-semibold text-slate-700">
              Company Name
            </label>
            <input
              id="add-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="add-vertical" className="block text-xs font-semibold text-slate-700">
              Vertical
            </label>
            <select
              id="add-vertical"
              value={verticalId}
              onChange={(e) => setVerticalId(e.target.value as VerticalId)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {VERTICALS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.rank}. {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="add-owner" className="block text-xs font-semibold text-slate-700">
              Owner Full Name
            </label>
            <input
              id="add-owner"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label htmlFor="add-email" className="block text-xs font-semibold text-slate-700">
              Direct Owner Email
            </label>
            <input
              id="add-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label htmlFor="add-city" className="block text-xs font-semibold text-slate-700">
              City
            </label>
            <input
              id="add-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="add-state" className="block text-xs font-semibold text-slate-700">
                State
              </label>
              <input
                id="add-state"
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs uppercase"
              />
            </div>
            <div>
              <label htmlFor="add-founded" className="block text-xs font-semibold text-slate-700">
                Founded Year
              </label>
              <input
                id="add-founded"
                type="number"
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-rev" className="block text-xs font-semibold text-slate-700">
              Est. Revenue ($M)
            </label>
            <input
              id="add-rev"
              type="number"
              step="0.1"
              value={estRevenueM}
              onChange={(e) => setEstRevenueM(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
            />
          </div>

          <div>
            <label htmlFor="add-ebitda" className="block text-xs font-semibold text-slate-700">
              Est. EBITDA ($M)
            </label>
            <input
              id="add-ebitda"
              type="number"
              step="0.1"
              value={estEbitdaM}
              onChange={(e) => setEstEbitdaM(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="add-re"
              type="checkbox"
              checked={ownsRealEstate}
              onChange={(e) => setOwnsRealEstate(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="add-re" className="text-xs text-slate-700">
              Owner holds industrial/commercial real estate (enables 10-yr NNN lease angle)
            </label>
          </div>

          {error && (
            <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
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
            type="submit"
            className="rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461]"
          >
            Add Target to Pipeline
          </button>
        </div>
      </form>
    </div>
  );
};
