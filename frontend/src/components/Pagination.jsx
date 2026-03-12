export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100"
      >
        ←
      </button>
      <span className="text-sm text-slate-600">
        {page} / {pages}
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100"
      >
        →
      </button>
    </div>
  );
}
