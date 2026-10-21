export default function Placeholder({ title, icon = 'bi-tools' }) {
  return (
    <div className="text-center text-muted py-5">
      <i className={`bi ${icon} display-4`}></i>
      <h4 className="mt-3">{title}</h4>
      <p>This page is coming next.</p>
    </div>
  );
}
