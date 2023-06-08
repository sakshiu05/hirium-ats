const createStatusCodeError = function (statusCode, message, body) {
    return Object.assign(new Error(), {
        statusCode,
        message,
        body,
    });
};

const badRequestError = (msg) => createStatusCodeError(422, msg);

const unverifiedError = (message) => createStatusCodeError(412, message);

const forbiddenError = (msg) => createStatusCodeError(403, msg);

const unauthorizedError = (msg) => createStatusCodeError(401, msg);

const notFoundError = (msg) => createStatusCodeError(404, msg);

const gonePage = (msg) => createStatusCodeError(400, msg);

const errorResponse = (res, message, statusCode) => {
    res.statusCode = statusCode;
    return res.json({
        success: false,
        statusCode,
        message,
    });
};

const checkResponse = async (res, data, message) => {
    if (!data) {
        return await badRequestError('Error');
    }
    return { statusCode: 200, message, body: data };
};

// Response handlers
const successResponse = (res, code, data, message) => res.status(code || 200).json({
    success: true,
    statusCode: code,
    data,
    message,
});

const okResponse = function (res, data, message = '') {
    res.statusCode = 200;
    return successResponse(res, 200, data, message);
};

const successData = function (message, data = '') {
    return { statusCode: 200, message, body: data };
};

const createdResponse = (res, data, message) => successResponse(res, 201, data, message);

const noContentResponse = (res, message) => successResponse(res, 204, {}, message);

module.exports = {
    checkResponse,
    badRequestError,
    okResponse,
    errorResponse,
    unverifiedError,
    forbiddenError,
    noContentResponse,
    createdResponse,
    notFoundError,
    unauthorizedError,
    gonePage,
    successData,
};
