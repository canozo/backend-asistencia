const setUserType = {
  admin: (req, res, next) => {
    req.body.idUserType = 1;
    next();
  },
  professor: (req, res, next) => {
    req.body.idUserType = 2;
    next();
  },
  student: (req, res, next) => {
    req.body.idUserType = 3;
    next();
  },
  camera: (req, res, next) => {
    req.body.idUserType = 4;
    next();
  },
};

module.exports = setUserType;
