const router = require('express').Router();

const CATEGORIAS = {
  deportes: '108',
  musica: '103',
  fiestas: '104',
  cultura: '105',
  gastronomia: '110',
};

router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    const catId = CATEGORIAS[categoria] || '';
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=Argentina&location.within=500km&location.latitude=-34.6037&location.longitude=-58.3816&expand=venue,ticket_availability&sort_by=date${catId ? `&categories=${catId}` : ''}&token=${process.env.EVENTBRITE_TOKEN}`;
    
    const r = await fetch(url);
    const data = await r.json();
    
    const eventos = (data.events || []).slice(0, 20).map(e => ({
      id: e.id,
      nombre: e.name?.text || '',
      descripcion: e.description?.text?.slice(0, 200) || '',
      fecha: e.start?.local || '',
      lugar: e.venue?.name || '',
      ciudad: e.venue?.address?.city || 'Argentina',
      precio: e.ticket_availability?.minimum_ticket_price?.display || 'Ver precio',
      imagen: e.logo?.url || null,
      url: e.url,
      categoria: categoria || 'general',
    }));

    res.json(eventos);
  } catch (err) {
    console.error('Eventbrite error:', err.message);
    res.status(500).json({ error: 'Error al obtener eventos.' });
  }
});

module.exports = router;
