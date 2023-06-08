const BASE_STRING = '/clients';
const express = require('express');
const authorization = require('@mayank_supersourcing/authenticator');
require('dotenv').config({ path: 'config/.env' });

const router = express.Router();
const { base64decode } = require('nodejs-base64');
const { handler } = require('../../utils/routeHandler');
const clientController = require('./clientController');
const rolesArray = require('../../middlewares/constArray'); // contain all roles name to give access to apis

const secretKey = process.env.JWT_SECRET;
const environment = process.env.ENVIRONMENT;

router.post(
    `${BASE_STRING}/`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(clientController.createClient, (req) => [req.body]),
);

router.get(
    `${BASE_STRING}/`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(clientController.list, (req) => [
        req.query.search,
        req.query.location,
        req.query.createdOn,
        req.query.page,
        req.query.offset,
        req.query.limit,
    ]),
);
router.get(
    `${BASE_STRING}/search-client`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(clientController.clientSearch, (req) => [req.query.search, req.query.limit]),
);

router.get(
    `${BASE_STRING}/project-associated-with-poc/:pocId`,
    handler(clientController.projectAssociatedWithPoc, (req) => [req.params.pocId]),
);

router.get(
    `${BASE_STRING}/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(clientController.get, (req) => [
        base64decode(req.params.id),
        req.query.search,
        req.query.roles,
        req.query.techskills,
        req.query.createdOn,
        req.query.page,
        req.query.offset,
        req.query.limit,
    ]),
);

router.put(
    `${BASE_STRING}/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(clientController.update, (req) => [base64decode(req.params.id), req.body]),
);

router.delete(
    `${BASE_STRING}/:id`,
    // [authorization.authenticate(secretKey, ['admin'])],
    handler(clientController.destroy, (req) => [base64decode(req.params.id)]),
);

module.exports = router;
