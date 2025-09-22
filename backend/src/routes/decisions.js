const express = require('express');
const router = express.Router();

// Decision support routes
router.get('/css-integration', (req, res) => {
  res.json({ message: 'CSS integration data' });
});

router.get('/beneficiary-mapping', (req, res) => {
  res.json({ message: 'Beneficiary mapping data' });
});

module.exports = router;



