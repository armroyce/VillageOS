import { useTranslation } from 'react-i18next';

export default function Table({ columns, data, onSort, sortKey, sortDir }) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return <p className="text-slate-400 text-sm py-8 text-center">{t('no_data')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-3 px-4 font-semibold text-slate-600 cursor-pointer select-none"
                onClick={() => onSort && onSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-slate-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
