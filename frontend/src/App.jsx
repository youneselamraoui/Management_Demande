import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [produits, setProduits] = useState([]);
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');

  const fetchProduits = () => {
    api.get('/produits').then(res => setProduits(res.data));
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/produits', { nom, prix: parseFloat(prix) });
    setNom('');
    setPrix('');
    fetchProduits();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Produits</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <input
          placeholder="Prix"
          type="number"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>

      <ul>
        {produits.map(p => (
          <li key={p.id}>{p.nom} — {p.prix} €</li>
        ))}
      </ul>
    </div>
  );
}

export default App;