CONFIG = {};
const devUrl = require('./baseurl').dev;
const stagingUrl = require('./baseurl').staging;
const prodUrl = require('./baseurl').prod;
// const dotenv = require('dotenv');
require('dotenv').config({ path: 'config/.env' });
// dotenv.config();

CLIENT_URL = '';
ADMIN_URL= '';
ATS_URL= '';
ATS_CLIENT_URL= '';
if (process.env.ENVIRONMENT == 'dev') {
    CLIENT_URL = devUrl.CLIENT_URL;
    ADMIN_URL = devUrl.ADMIN_URL;
    ATS_CLIENT_URL = devUrl.ATS_CLIENT_URL;
    ATS_URL = devUrl.ATS_URL;
} else if (process.env.ENVIRONMENT == 'staging') {
    CLIENT_URL = stagingUrl.CLIENT_URL;
    ADMIN_URL = stagingUrl.ADMIN_URL;
    ATS_URL = stagingUrl.ATS_URL;
} else if (process.env.ENVIRONMENT == 'prod') {
    CLIENT_URL = prodUrl.CLIENT_URL;
    ADMIN_URL = prodUrl.ADMIN_URL;
    ATS_URL = prodUrl.ATS_URL;
}

module.exports = {
    sendgrid: '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',
    clientUrl: CLIENT_URL,
    adminUrl: ADMIN_URL,
    atsUrl:ATS_URL,
    atsClientUrl: ATS_CLIENT_URL,
    CONFIG
};
