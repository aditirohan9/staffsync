export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <small className="text-muted">Page {page} of {totalPages}</small>
      <div className="btn-group btn-group-sm">
        <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <i className="bi bi-chevron-left"></i> Prev
        </button>
        <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
