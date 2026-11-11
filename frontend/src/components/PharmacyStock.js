import React, { useEffect, useState } from 'react';
import { Boxes } from 'lucide-react';
import { medicinesApi } from '../services/api';

/** One stock row: quantity is edited in place and saved per row. */
const StockRow = ({ item, onSaved }) => {
  const [qty, setQty] = useState(String(item.stock_quantity));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const low = item.stock_quantity <= item.reorder_level;
  const dirty = qty !== String(item.stock_quantity);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onSaved(await medicinesApi.setStock(item.inventory_id, Number(qty)));
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {item.medicine_name} <span className="font-normal text-slate-500">{item.strength}</span>
        </p>
        <p className="text-xs text-slate-500 tabular-nums">
          Batch {item.batch_number} • exp {item.expiry_date} • ₹{item.unit_price.toFixed(2)}
        </p>
        {low && (
          <p className="text-xs font-semibold text-amber-700 mt-0.5">
            {item.stock_quantity === 0 ? 'ਖ਼ਤਮ (Out of stock)' : `ਘੱਟ ਸਟਾਕ (Low, reorder at ${item.reorder_level})`}
          </p>
        )}
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
      <form onSubmit={save} className="shrink-0 flex items-center gap-2">
        <label htmlFor={`qty-${item.inventory_id}`} className="sr-only">Quantity of {item.medicine_name}</label>
        <input
          id={`qty-${item.inventory_id}`}
          type="number"
          min={0}
          max={100000}
          required
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className={`w-20 bg-slate-50 border rounded-lg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 ${low ? 'border-amber-300' : 'border-slate-300'}`}
        />
        <button
          type="submit"
          disabled={!dirty || saving}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-40 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-[background-color,transform]"
        >
          {saving ? '…' : 'Save'}
        </button>
      </form>
    </li>
  );
};

export const PharmacyStock = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    medicinesApi.inventory()
      .then(setItems)
      .catch(() => setError('ਸਟਾਕ ਲੋਡ ਨਹੀਂ ਹੋਇਆ (Could not load stock)'))
      .finally(() => setLoading(false));
  }, []);

  const lowCount = items.filter((i) => i.stock_quantity <= i.reorder_level).length;
  const replace = (updated) => setItems((prev) => prev.map((i) => (i.inventory_id === updated.inventory_id ? updated : i)));

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>ਦਵਾਈ ਸਟਾਕ (Stock: {items.length})</span>
        </h3>
        {lowCount > 0 && (
          <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded tabular-nums">
            {lowCount} low
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Patients see these numbers when they search — keep them current.
      </p>

      {error && <p role="alert" className="text-xs text-red-600 mt-3">{error}</p>}
      {loading ? (
        <p className="text-xs text-slate-400 py-4">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">ਕੋਈ ਸਟਾਕ ਦਰਜ ਨਹੀਂ (No stock recorded yet)</p>
      ) : (
        <ul className="divide-y divide-slate-100 mt-2">
          {items.map((item) => <StockRow key={item.inventory_id} item={item} onSaved={replace} />)}
        </ul>
      )}
    </section>
  );
};
