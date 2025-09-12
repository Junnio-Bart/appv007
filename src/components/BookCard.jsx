export default function BookCard({ book, selected, onSelect }) {
  const pct = book.pagesTotal ? Math.round((book.pagesRead / book.pagesTotal) * 100) : 0;

  return (
    <li className={`book-card ${selected ? "is-active" : ""}`} onClick={onSelect} role="button" tabIndex={0}>
      <div className="book-card-cover">
        {book.cover ? (
          <img src={book.cover} alt={`Capa de ${book.title}`} />
        ) : (
          <div className="book-card-placeholder">Livro</div>
        )}
      </div>

      <div className="book-card-meta">
        <h3 className="book-title">{book.title}</h3>
        {!!book.author && <p className="book-author">por {book.author}</p>}
        <p className="book-progress">{book.pagesRead} / {book.pagesTotal} páginas · {pct}%</p>
      </div>
    </li>
  );
}
