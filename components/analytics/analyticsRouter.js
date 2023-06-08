const BASE_STRING = '/analytics';

const express = require('express');

const router = express.Router();

const { handler } = require('../../utils/routeHandler');
const analyticsController = require('./analyticsController');

router.get(
    `${BASE_STRING}/openJobs`,
    handler(analyticsController.getOpenJobIds, (req) => [req]),
);

router.get(
    `${BASE_STRING}/jobGraph`,
    handler(analyticsController.getJobsGraphData, (req) => [
        req.query.startDate,
        req.query.endDate,
        req.query.groupBy,
    ]),
);

module.exports = router;
