const BASE_STRING = '/projects';
const express = require('express');
const authorization = require('@mayank_supersourcing/authenticator');
require('dotenv').config({ path: 'config/.env' });
const { base64decode } = require('nodejs-base64');

const router = express.Router();
const { handler } = require('../../utils/routeHandler');
const Projects = require('./projectsController');
const rolesArray = require('../../middlewares/constArray'); // contain all roles name to give access to apis

const secretKey = process.env.JWT_SECRET;
const environment = process.env.ENVIRONMENT;

/** ***********************All the routes without /:id will come in this section************************ */

router.post(
    `${BASE_STRING}/post-job-ats`,
    // [authorization.authenticatePermission(secretKey)],
    [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    handler(Projects.postJobATS, (req, res) => [req.body, res]),
);

router.post(
    `${BASE_STRING}/draft-job-ats`,
    // [authorization.authenticatePermission(secretKey)],
    [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    handler(Projects.draftJobATS, (req, res) => [req.body, res]),
);

router.post(
    `${BASE_STRING}/add-job-settings`,
    // [authorization.authenticatePermission(secretKey)],
    [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.atsAdminPermission)],
    handler(Projects.addJobSettings, (req, res) => [req.body, res]),
);

router.get(
    `${BASE_STRING}/job`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.jobListing, (req, res) => [req, res]),
);

router.get(
    `${BASE_STRING}/cronCode`,
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.cronCode),
);

router.get(
    `${BASE_STRING}/create-rand-no`,
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.apiForOneTimeRandNo),
);

router.get(
    `${BASE_STRING}/get-job-settings`,
    [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    handler(Projects.getJobSettings, (req, res) => [req, res]),
);

router.get(
    `${BASE_STRING}/offer-details`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.developerPermissions)],
    handler(Projects.jobOfferDetails, (req, res) => [base64decode(req.query.project_id), req.query.status, res.tokenData]),
);

router.get(
    `${BASE_STRING}/jobs-project-count`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.jobsProjectCount),
);

router.post(
    `${BASE_STRING}/for-one-time`,
    handler(Projects.apiForOneTime, (req) => [req.body]),
);

router.post(
    `${BASE_STRING}/update-is-world-wide`,
    // [authorization.authenticate(secretKey, ['admin'])],
    handler(Projects.updateIsWorldWideForExistingRecord),
);
router.get(
    `${BASE_STRING}/`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.list, (req) => [
        req.query.filters,
        req.query.limit,
        req.query.page,
        req.query.showAnswer,
    ]),
);
router.get(
    `${BASE_STRING}/job-list`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.jobListForAdmin, (req) => [req]),
);

router.get(
    `${BASE_STRING}/win-loss-job-list`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.WinAndLossJobList, (req) => [req]),
);

router.get(
    `${BASE_STRING}/closed-job-avg`,
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.closedJobAvg, (req) => [req]),
);

router.get(
    `${BASE_STRING}/apiForOneTimeForJobStatusDate`,
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.apiForOneTimeForJobStatusDate, (req) => [req]),
);

router.put(
    `${BASE_STRING}/update-job-type`,
    [authorization.authenticatePermission(secretKey)],
    handler(Projects.addTypeKeyforJob),
);

router.put(
    `${BASE_STRING}/update-job-settings`,
    [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.atsAdminPermission)],
    handler(Projects.updateJobSettings, (req, res) => [req.body, res]),
);

router.get(
    `${BASE_STRING}/ats-jobs-list`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.atsJobList, (req, res) => [req, res]),
);

router.put(
    `${BASE_STRING}/move-ats-paused-job-to-open`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.moveATSJobToOpenFromPaused, (req) => [req.body]),
);

router.post(
    `${BASE_STRING}/ats-jobs-for-candidate`,
    handler(Projects.getJobsForCandidate, (req) => [
        req.body,
        req.query.search,
        req.query.limit,
        req.query.offset,
    ]),
);

router.get(
    `${BASE_STRING}/get-jobs-header-count`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.getHeaderCountForJobs, (req, res) => [res]),
);

/** ***********************All the routes with /:id will come in this section************************** */

router.get(
    `${BASE_STRING}/jobs-according-to-role/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.getJobAccordingToUserRole, (req, res) => [base64decode(req.params.id), req, res]),
);

router.post(
    `${BASE_STRING}/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.create, (req) => [base64decode(req.params.id), req.body]),
);

router.put(
    `${BASE_STRING}/job-status/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.jobsWinLoss, (req) => [base64decode(req.params.id), req.body]),
);

router.put(
    `${BASE_STRING}/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.projectUpdate, (req, res) => [base64decode(req.params.id), req.body, res]),
);

router.get(
    `${BASE_STRING}/career-page-jobs/:id`,
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.careerPageJobList, (req) => [req]),
);

router.put(
    `${BASE_STRING}/move-job-status-wise/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.moveATSJobStatusWise, (req, res) => [base64decode(req.params.id), req.body, req.query.status, res]),
);

router.get(
    `${BASE_STRING}/job-detail/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.jobDetailForAdmin, (req) => [base64decode(req.params.id)]),
);
router.get(
    `${BASE_STRING}/ats-job-detail/:id`,
    [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)], //
    handler(Projects.getATSJobDetails, (req, res) => [base64decode(req.params.id), res]),
);

router.get(
    `${BASE_STRING}/:id`,
    // [authorization.authenticate(secretKey, ['individual-engineer', 'admin', 'sales_manager', 'tp_associate', 'am_associate', 'talent_partner', 'account_manager', 'ats_superadmin', 'ats_super_admin', 'ats_admin', 'ats_team_member', 'ats_restricted_team_member', 'human_resources'])],
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)], //
    handler(Projects.getSingleProject, (req, res) => [req, base64decode(req.params.id), res]),
);

router.get(
    `${BASE_STRING}/get-single-client/:id`,
    handler(Projects.getSingleProjectClientDetail, (req) => [base64decode(req.params.id)]),
);

router.get(
    `${BASE_STRING}/user-job/:id`,
    [authorization.authenticatePermission(secretKey, environment, '', rolesArray.allPermissions)],
    handler(Projects.job, (req) => [base64decode(req.params.id)]),
);

router.put(
    `${BASE_STRING}/update-interaction-count/:id`,
    handler(Projects.updateJobInteractionCount, (req) => [req.body, base64decode(req.params.id)]),
);

// router.get(
//     `${BASE_STRING}/career-page-job-detail/:tenantid/:jobid`,
//     handler(Projects.getCareerJobDetails, (req) => [base64decode(req.params.tenantid), base64decode(req.params.jobid)]),
// );
router.get(
    `${BASE_STRING}/career-page-job-detail/:atsadminid/:jobid`,
    handler(Projects.getCareerJobDetails, (req) => [base64decode(req.params.atsadminid), base64decode(req.params.jobid)]),
);

router.get(
    `${BASE_STRING}/closed-job-avg/:year/:month`,
    // [authorization.authenticatePermission(secretKey, environment, '', rolesArray.teamPermissions)],
    handler(Projects.closedJobAvg, (req) => [req]),
);

module.exports = router;
