const router = require('express').Router();

const CATEGORIAS_MAP = {
  musica: ['concerts'],
  deportes: ['sports'],
  fiestas: ['community', 'festivals'],
  cultura: ['performing-arts', 'expos'],
  gastronomia: ['food-drink'],
  todos: ['concerts', 'sports', 'community', 'festivals', 'performing-arts'],
};

router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    const cats = CATEGORIAS_MAP[categoria] || CATEGORIAS_MAP['todos'];
    const hoy = new Date().toISOString().split('T')[0];

    const resultados = await Promise.all(cats.map(async (cat) => {
      const url = `https://api.predicthq.com/v1/events/?country=AR&limit=5&sort=start&category=${cat}&start.gte=${hoy}`;
      const r = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.PREDICTHQ_TOKEN}`,
          'Accept': 'application/json',
        }
      });
      const data = await r.json();
      return data.results || [];
    }));

    const todos = resultados.flat().sort((a, b) => new Date(a.start_local) - new Date(b.start_local));

    const eventos = todos.map(e => ({
      id: e.id,
      nombre: e.title,
      descripcion: e.description || '',
      fecha: e.start_local,
      lugar: e.entities?.find(x => x.type === 'venue')?.name || '',
      direccion: e.entities?.find(x => x.type === 'venue')?.formatted_address || '',
      ciudad: e.geo?.address?.region || 'Argentina',
      categoria: e.category,
      ranking: e.rank,
      asistencia: e.phq_attendance,
      imagen: null,
    }));

    res.json(eventos);
  } catch (err) {
    console.error('PredictHQ error:', err.message);
    res.status(500).json({ error: 'Error al obtener eventos.' });
  }
});

module.exports = router;
