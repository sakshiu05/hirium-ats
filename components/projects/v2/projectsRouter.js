const BASE_STRING = '/projects-v2';
const express = require('express');
const authorization = require('@mayank_supersourcing/authenticator');
require('dotenv').config({ path: 'config/.env' });
const { base64decode } = require('nodejs-base64');

const router = express.Router();
const { handler } = require('../../../utils/routeHandler');
const Projects = require('./projectsController');
const rolesArray = require('../../../middlewares/constArray'); // contain all roles name to give access to apis

const secretKey = process.env.JWT_SECRET;
const environment = process.env.ENVIRONMENT;

router.get(
    `${BASE_STRING}/assigned-jobs`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.assignedJobsList, (req, res) => [req, res]),
);

router.get(
    `${BASE_STRING}/open-jobs`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.openJobs, (req) => [req]),
);

router.get(
    `${BASE_STRING}/closed-jobs`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.closedJobs, (req, res) => [req, res]),
);

router.get(
    `${BASE_STRING}/on-hold-jobs`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.onHoldJobs, (req, res) => [req, res]),
);

router.get(
    `${BASE_STRING}/jobs-header-count`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.jobsHeaderCount, (req, res) => [req, res]),
);

router.post(
    `${BASE_STRING}/assign-talent-manager-associate`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.assignTalentManagerAssociate, (req) => [req.body, req.headers.authorization]),
);

// !To reassign
router.put(
    `${BASE_STRING}/assign-talent-manager-associate`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.reAssignTalentManagerAssociate, (req) => [req.body, req.headers.authorization]),
);

router.get(
    `${BASE_STRING}/jobs-according-to-time-interval`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.getJobAccordingToTimeInterval, (req) => [
        req.query.start_date,
        req.query.end_date,
        req.query.platform_type,
        req.query.type,
    ]),
);

router.post(
    `${BASE_STRING}/jobs-detail-according-to-time-interval`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.jobDetailForDashboard, (req) => [
        req.body.jobArr,
    ]),
);

router.get(
    `${BASE_STRING}/remove-ats-jobs`,
    handler(Projects.apiForOneTimeRemoveATSJobs),
);

router.get(
    `${BASE_STRING}/jobs-according-to-opening-closer`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.getJobsCountForOpeningCloser, (req) => [
        req.query.start_date,
        req.query.end_date,
        req.query.platform_type,
        req.query.type,
    ]),
);

router.get(
    `${BASE_STRING}/jobs-details-for-dashboard-graph`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.getJobDetailsAccordingToTimeInterval, (req) => [
        req.query.start_date,
        req.query.end_date,
        req.query.platform_type,
        req.query.type,
    ]),
);

router.put(
    `${BASE_STRING}/move-job/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.updateOpenHoldJobsStatus, (req) => [base64decode(req.params.id), req.body]),
);

router.get(
    `${BASE_STRING}/get-info/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)], //
    handler(Projects.getFewDetailsOfProject, (req) => [base64decode(req.params.id)]),
);

module.exports = router;
