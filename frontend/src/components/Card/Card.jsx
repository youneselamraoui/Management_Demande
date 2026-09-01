function Card({ title, category, content, legend, stats }) {
  return (
    <div className="card">
      <div className="content">
        {category && <p className="category">{category}</p>}
        {title && <h4 className="title">{title}</h4>}
        {content}
        {legend}
      </div>
      {stats && <div className="footer">{stats}</div>}
    </div>
  );
}
export default Card;