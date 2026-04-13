const router = require('express').Router();

const traducir = async (texto, lang) => {
  if (!texto || lang === 'es') return texto;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${lang}&dt=t&q=${encodeURIComponent(texto)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join('');
  } catch { return texto; }
};

router.get('/', async (req, res) => {
  try {
    const { q, ciudad } = req.query;
    const lugar = ciudad || 'Buenos Aires';
    const query = q ? `${q} ${lugar}` : `eventos ${lugar}`;
    
    const url = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(query)}&hl=es&gl=ar&api_key=${process.env.SERPAPI_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    const eventos = (data.events_results || []).map(e => ({
      id: e.title + e.date?.start_date,
      nombre: e.title,
      fecha: e.date?.start_date || '',
      hora: e.date?.when || '',
      lugar: e.venue?.name || '',
      direccion: e.address?.join(', ') || '',
      ciudad: lugar,
      descripcion: e.description || '',
      imagen: e.thumbnail || null,
      ticket_url: e.ticket_info?.[0]?.link || null,
      ticket_precio: e.ticket_info?.[0]?.price || null,
      fuente: 'google',
    }));

    const lang = req.query.lang || 'es';
    if (lang !== 'es') {
      for (const e of eventos) {
        if (e.descripcion) e.descripcion = await traducir(e.descripcion, lang);
      }
    }
    res.json(eventos);
  } catch (err) {
    console.error('SerpAPI error:', err.message);
    res.status(500).json({ error: 'Error al obtener eventos.' });
  }
});

module.exports = router;
