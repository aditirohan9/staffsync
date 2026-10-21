import { useEffect } from 'react';

// Lightweight Bootstrap-styled modal (no Bootstrap JS needed)
export default function Modal({ show, title, onClose, children }) {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <>
      <div className="modal d-block" tabIndex="-1" onMouseDown={onClose}>
        <div className="modal-dialog modal-dialog-centered" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}
