const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const { fetchHearthisMixes } = require('../services/hearthis');

router.post('/api/signup', userCtrl.signup);
router.get('/api/hearthis/:username/mixes', async (req, res) => {
  try {
    const payload = await fetchHearthisMixes(req.params.username);
    res.json(payload);
  } catch (error) {
    res.status(502).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;
