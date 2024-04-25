const createError = require("./create-error");
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authorizationHeader = req.header('Authorization');

    if (!authorizationHeader) {
        return next(createError(401, 'You are not authorized'));
    }

    try {
        const token = authorizationHeader.split(' ')[1];

        if (!token) {
            return next(createError(401, 'You are not authenticated'));
        }

        const decodedToken = jwt.verify(token, process.env.JWT_TOKEN);

        if (!decodedToken) {
            return next(createError(403, 'Token is invalid'));
        }

        req.userId = decodedToken.userId;
        req.role = decodedToken.role;

        next();

    } catch (error) {
        const errorObj = error instanceof jwt.TokenExpiredError ? { ...error, message: 'Token is expired' } :
            error instanceof jwt.JsonWebTokenError ? { ...error, message: 'Token is invalid' } : error;

        next(errorObj);
    }
}

function verifyPermission(req, res, next) {
    verifyToken(req, res, (err) => {
        if (err) return next(err);

        if (req.role !== 'provider') {
            return next(createError(403, 'You are not authorized!'));
        }

        next();
    });
}

module.exports = { verifyToken, verifyPermission };