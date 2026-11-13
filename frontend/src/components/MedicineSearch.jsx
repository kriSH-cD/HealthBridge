import React, { useState } from 'react';
import { Phone, Pill, Search } from 'lucide-react';
import { medicinesApi } from '../services/api';

const rupees = (n) => `₹${Number(n).toFixed(2)}`;

/** "Which chemist near me has this medicine?" Call before travelling. */
export const MedicineSearch = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (e) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await medicinesApi.availability(q.trim()));
    } catch {
      setError('ਖੋਜ ਨਹੀਂ ਹੋ ਸਕੀ (Search failed, try again)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Pill className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        <span>ਦਵਾਈ ਕਿੱਥੇ ਮਿਲੇਗੀ? (Find a medicine)</span>
      </h3>
      <p className="text-xs text-slate-500 mt-1">ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਫ਼ੋਨ ਕਰਕੇ ਪੱਕਾ ਕਰੋ — call before you travel.</p>

      <form onSubmit={search} role="search" className="mt-4 flex gap-2">
        <label htmlFor="medicine-q" className="sr-only">Medicine name</label>
        <input
          id="medicine-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Paracetamol, Metformin…"
          minLength={2}
          className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading || q.trim().length < 2}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 text-white font-semibold text-sm px-4 rounded-xl flex items-center gap-1.5 transition-[background-color,transform]"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span>{loading ? '…' : 'ਖੋਜੋ'}</span>
        </button>
      </form>

      {error && <p role="alert" className="text-xs text-red-600 mt-3">{error}</p>}

      {results && (
        <div aria-live="polite" className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-slate-600 py-3">
              ਕਿਸੇ ਵੀ ਦੁਕਾਨ 'ਤੇ ਸਟਾਕ ਨਹੀਂ (Not in stock at any listed pharmacy)
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((r) => (
                <li key={r.inventory_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {r.medicine_name} <span className="font-normal text-slate-500">{r.strength}</span>
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {r.pharmacy_name.replace(' [DEMO DATA]', '')} • {r.pharmacy_village || r.pharmacy_address}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-800">{rupees(r.unit_price)}</span>
                      {' '}• {r.stock_quantity} in stock
                    </p>
                  </div>
                  <a
                    href={`tel:${r.pharmacy_phone}`}
                    className="shrink-0 min-h-11 flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs px-3 rounded-xl transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Call</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
