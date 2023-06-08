const jobsRouter = require('./projects/projectsRouter');
const clientsRouter = require('./clients/clientRouter');
const jobsRouterV2 = require('./projects/v2/projectsRouter');
const analyticsRouter = require('./analytics/analyticsRouter');

module.exports = [jobsRouter, jobsRouterV2, clientsRouter, analyticsRouter];
