export default function LogoButton({ onClick, ariaLabel = "BooK", src, height }) {
  return (
    <button type="button" className="logo-btn" onClick={onClick} aria-label={ariaLabel}>
      {src ? (
        <img
          src={src}
          alt="BooK"
          className="logo-img"
          style={height ? { height } : undefined}
        />
      ) : (
        <span className="logo-text">
          <span className="b1">Bo</span>
          <span className="b2">o</span>
          <span className="b3">K</span>
        </span>
      )}
    </button>
  );
}
