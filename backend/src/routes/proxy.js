const express = require('express');
const router = express.Router();

// Allowed remote sources mapping
const TILE_SOURCES = {
  worldcover: (z, x, y) => `https://tiles.maps.eox.at/wmts/1.0.0/WORLD_COVER_2021/style/default/GoogleMapsCompatible/${z}/${y}/${x}.png`,
  gsw: (z, x, y) => `https://global-surface-water.appspot.com/tiles/occurrence/${z}/${x}/${y}.png`,
};

router.get('/tiles/:source/:z/:x/:y.png', async (req, res) => {
  try {
    const { source, z, x, y } = req.params;
    if (!TILE_SOURCES[source]) {
      return res.status(400).json({ error: 'Unsupported tile source' });
    }
    const url = TILE_SOURCES[source](z, x, y);
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream error');
    }
    // Set caching headers
    res.set('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    res.status(500).json({ error: 'Proxy error' });
  }
});

module.exports = router;


