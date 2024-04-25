function createResponse(res, statusCode, payload) {
    return res.status(statusCode).json(payload);
}

module.exports = createResponse;