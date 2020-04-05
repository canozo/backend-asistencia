module.exports = (req, res, next) => {
  if (isNaN(req.params.from)) {
    return res.json({ status: 'error', msg: 'Parametro "from" no es un numero.' });
  } else if (isNaN(req.params.to)) {
    return res.json({ status: 'error', msg: 'Parametro "to" no es un numero.' });
  }

  const from = Number(req.params.from);
  let to = Number(req.params.to);

  if (to - from < 5) {
    // trying to paginate too little, min at 5
    to = from + 5;
  }

  if (to - from > 50) {
    // trying to paginate too many, max at 50
    to = from + 50;
  }

  req.params.from = from;
  req.params.to = to;
  next();
};
