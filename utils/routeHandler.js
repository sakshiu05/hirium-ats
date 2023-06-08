const globalCalls = require('./functions');

const handler = (promise, params) => async (req, res, next) => {
    const boundParams = params ? params(req, res, next) : [];
    try {
        const result = await promise(...boundParams);

        // ------------ While login set header start -----------------//
        if (result.body && result.body.setHeaders && result.body.setHeaders === 'setTokenInHeader') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Authorization', `Bearer ${result.body.token}`);
            res.setHeader('Access-Control-Expose-Headers', [
                'Authorization',
                'x-amzn-Remapped-authorization',
            ]);
            delete result.body.token;
            delete result.body.setHeaders;
        }
        // ------------ While login set header end -----------------//

        // ----------------- Common Error Message Start ---------------------//
        if (result.statusCode === 200) {
            return globalCalls.okResponse(res, result.body, result.message);
        }
        if (result.statusCode !== 200) {
            return res.status(result.statusCode).json({
                statusCode: result.statusCode,
                message: result.message,
                body: result.body,
            });
        }

        // ----------------- Common Error Message Start ---------------------//

        // ----------------- Joi Error Message Start ---------------------//
        if (result.error) {
            return res
                .status(400)
                .json({
                    statusCode: 400,
                    message: result.error.details[0].message,
                });
        }
        // console.log(result.value);
        // ----------------- Joi Error Message Start ---------------------//
        return res.json(result || { message: 'OK11' });
    } catch (error) {
        return res.status(500).json(error);
    }
};
module.exports = { handler };
