import React, { useState } from 'react';
import { Check, Copy, Download, Monitor, Smartphone } from 'lucide-react';
import { generateMultiNicheWebsiteHtml } from '../utils/outreachEngine';

export const WebsitePreviewView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const htmlSource = generateMultiNicheWebsiteHtml();

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlSource], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlSource);
    } catch {
      // ignore clipboard errors
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-6 py-4">
        <div className="max-w-2xl">
          <h2 className="font-display text-lg font-semibold text-[#0F2342]">
            Full Multi-Niche Website — Ready for Netlify Drop (keystonedealpartners.com)
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Matches your warm-cream &amp; institutional navy design (Newsreader + Public Sans) with
            all 6 sections: Hero, 4 Multi-Niche Sectors, Deal Structures, 4-Step Process,
            Confidentiality &amp; 0% Commission Guarantee, 6 FAQs, and your working Netlify
            Confidential Inquiry form (<span className="font-mono">data-netlify=&quot;true&quot;</span>).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                viewport === 'desktop'
                  ? 'bg-white text-[#0F2342] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                viewport === 'mobile'
                  ? 'bg-white text-[#0F2342] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyHtml}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'HTML Copied' : 'Copy HTML'}
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Download index.html
          </button>
        </div>
      </div>

      {/* Live Preview Canvas */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 font-mono text-xs text-slate-500">
          <span>https://keystonedealpartners.com — Full Standalone Netlify Deployment Preview</span>
          <span className="text-[11px] text-slate-400">
            Drop downloaded index.html into a folder → drag onto Netlify Deploys (or push to repo)
          </span>
        </div>
        <div className="flex justify-center p-0 sm:p-4">
          <iframe
            title="Keystone Deal Partners Multi-Niche Website Preview"
            srcDoc={htmlSource}
            className={`h-[700px] border-0 bg-white transition-all ${
              viewport === 'mobile'
                ? 'w-[390px] rounded-lg border border-slate-300 shadow-md'
                : 'w-full rounded-md border border-slate-200'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
