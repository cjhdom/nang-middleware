var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.context.isWaiting) {
    return res.render('waiting', {uuid: req.cookies.uuid || res.cookies.uuid});
  }
  res.render('index', { data: 'real' });
});

router.get('/exit', function(req, res, next) {
    res.render('index', { data: 'exit' });
});

module.exports = router;
