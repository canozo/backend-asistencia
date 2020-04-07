const min = 5;
const max = 50;

module.exports = (req, res, next) => {
  if (isNaN(req.params.from)) {
    return res.json({ status: 'error', msg: 'Parametro "from" no es un numero.' });
  } else if (isNaN(req.params.to)) {
    return res.json({ status: 'error', msg: 'Parametro "to" no es un numero.' });
  }

  const from = Number(req.params.from);
  let to = Number(req.params.to);

  if (to - from < min) {
    // trying to paginate too little
    to = from + min;
  }

  if (to - from > max) {
    // trying to paginate too many
    to = from + max;
  }

  req.params.from = from;
  req.params.to = to;
  next();
};
