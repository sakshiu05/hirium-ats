const RequestMap = require('@mayank_supersourcing/request-map');
const { ObjectId } = require('mongodb');
const { Projects } = require('../projectsModel');
const globalCalls = require('../../../utils/functions');
const globalConst = require('../../../config/constants');
// eslint-disable-next-line import/no-useless-path-segments
const validator = require('../v2/projectsValidation');
// const { base64encode, base64decode } = require('nodejs-base64');
const config = require('../../../config/awsConfig');
// eslint-disable-next-line import/order
const messageHub = require('@mayank_supersourcing/message-hub')(config);

const request = new RequestMap({ environment: process.env.ENVIRONMENT });

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 04-04-2023
 * Function Name: assignedJobsList
 * API: projects/assigned-jobs
 * Method: GET
 * Description: To show all job that are asssigned to the sales associate
 */
const assignedJobsList = async (req, res) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);

        const condition = {};
        condition.platform_type = 'pre-hire';
        condition.status = { $in: ['assigned'] };
        condition.job_status = { $nin: ['Win', 'Loss', 'On-Hold'] };

        if (res.tokenData.user_role === 'tp_associate') {
            condition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
        }

        // !
        // -------------- Filter start ------------------//
        if (req.query.search) {
            const { search } = req.query;
            condition.$or = [{ job_title: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim()}.*` } }, { type: { $regex: `.*${search.trim()}.*` } }];
        }

        if (req.query._id && req.query._id.length > 0) {
            condition._id = ObjectId(req.query._id);
        }

        if (req.query.search && req.query.search.length > 0) {
            condition.$or = [{ client_name: { $regex: `.*${req.query.search.trim()}.*` } }, { project_id: { $regex: `.*${req.query.search.trim().toUpperCase()}.*` } }];
        }

        if (req.query.roles) {
            const roleArr = req.query.roles.split(',');
            condition['role.role'] = ({ $in: roleArr });
        }

        if (req.query.no_requirements && req.query.no_requirements.length > 0) {
            if (typeof (req.query.no_requirements) === 'string') {
                req.query.no_requirements = parseInt(req.query.no_requirements, 10);
            }
            condition.no_requirements = req.query.no_requirements;
        }

        if (req.query.experience_range_id && req.query.experience_range_id.length > 0) {
            condition['experience_range._id'] = ObjectId(req.query.experience_range_id);
        }

        if (req.query.client_id && req.query.client_id.length > 0) {
            condition.client_id = ObjectId(req.query.client_id);
        }

        if (req.query.techskills) {
            const techskillsArr = req.query.techskills.split(',');
            condition['primary_skills.skill'] = ({ $in: techskillsArr });
        }
        // !

        /* const projectData = await Projects.find(condition)
            .skip(req.query.offset)
            .limit(req.query.limit)
            .select('_id project_id role primary_skills experience_range no_requirements month_of_engagement talent_manager_associate')
            .select('client_name client_id sales_poc  expectations createdAt')
            .select('client_poc._id client_poc.email client_poc.mobile_number client_poc.client_poc')
            // .where('job_status')
            // .eq(null)
            .sort({ updatedAt: -1, createdAt: -1 }); */

        const projectData = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $lookup:
                {
                    from: 'clients',
                    localField: 'client_id',
                    foreignField: '_id',
                    as: 'client_info',
                },
            },
            {
                $project: {
                    _id: 1,
                    role: 1,
                    primary_skills: 1,
                    client_id: 1,
                    client_name: 1,
                    createdAt: 1,
                    experience_range: 1,
                    client_price: 1,
                    working_hours: 1,
                    interview_rounds: 1,
                    communication_skill: 1,
                    client_poc: 1,
                    ss_price: 1,
                    month_of_engagement: 1,
                    engagement_type: 1,
                    tentative_start: 1,
                    expectations: 1,
                    secondary_skills: 1,
                    working_time_zone: 1,
                    travel_preference: 1,
                    city_preference: 1,
                    tools_used: 1,
                    system_provided: 1,
                    job_responsibility: 1,
                    location: 1,
                    project_id: 1,
                    no_requirements: 1,
                    interested_count: 1,
                    interviewing_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    job_status: 1,
                    job_status_date: 1,
                    updatedAt: 1,
                    type: 1,
                    talent_manager_associate: 1,
                    sales_poc: 1,

                    is_world_wide: 1,
                    'client_info._id': 1,
                    'client_info.name': 1,
                    'client_info.about_company': 1,
                },
            },
        ]);

        const countProject = await Projects.find(condition).where('job_status').eq(null).countDocuments();

        // -------------- Display jobs count in list start------------------//
        const jobs2 = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $group: {
                    _id: null,
                    jobIds: { $push: '$_id' },
                },
            },
            {
                $project: {
                    _id: 1,
                    jobIds: 1,
                },
            },
        ]);

        if (jobs2.length > 0) {
            const jobIds = jobs2[0].jobIds.map((objId) => objId.toString());

            const developerInterestCount = await request.post(
                {},
                'jobs-interaction-service',
                '/job-interaction-v2/jobs-count',
                {
                    project_id: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );

            for (let i = 0; i < projectData.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.jobHeaderCount.length; j += 1) {
                    if (projectData[i]._id.toString() === developerInterestCount.data.data.jobHeaderCount[j].project_id) {
                        projectData[i].job_counts = {
                            applied: {
                                appliedDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interested_total_count, 10) : 0,
                                outboundDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].outbound_total_count, 10) : 0,
                            },
                            shortListed: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].shortlisted_count, 10) : 0,
                            vetting: {
                                skillVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].skill_vetting_count, 10) : 0,
                                verification: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].verification_count, 10) : 0,
                                hrVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].hr_vetting_count, 10) : 0,
                            },
                            interviews: [
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round1, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round2, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round3, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round4, 10) : 0,
                                },
                            ],
                            hired: {
                                selected: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_count, 10) : 0,
                                offerSent: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_send_count, 10) : 0,
                            },
                            clientOnboarding: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_accepted_count, 10) : 0,
                            rejected: {
                                movedToBenchpool: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].benchpool_count, 10) : 0,
                                reject: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].rejected_count, 10) : 0,
                            },
                        };
                    }
                }
            }
        }
        // -------------- Display jobs count in list ends------------------//

        const responseData = {
            projectData,
            total: countProject,
        };

        return globalCalls.successData('Assigned Job list found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 04-04-2023
 * Function:
 * API: projects/
 * Method: GET
 * Description: To show all open job
 */
const openJobs = async (req) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);

        const condition = {
            platform_type: 'pre-hire',
            status: { $in: ['open'] },
            job_status: { $nin: ['Win', 'Loss', 'On-Hold'] },
        };

        // !
        // -------------- Filter start ------------------//
        if (req.query.search) {
            const { search } = req.query;
            condition.$or = [{ job_title: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim()}.*` } }, { type: { $regex: `.*${search.trim()}.*` } }];
        }

        if (req.query._id && req.query._id.length > 0) {
            condition._id = ObjectId(req.query._id);
        }

        if (req.query.search && req.query.search.length > 0) {
            condition.$or = [{ client_name: { $regex: `.*${req.query.search.trim()}.*` } }, { project_id: { $regex: `.*${req.query.search.trim().toUpperCase()}.*` } }];
        }

        if (req.query.roles) {
            const roleArr = req.query.roles.split(',');
            condition['role.role'] = ({ $in: roleArr });
        }

        if (req.query.no_requirements && req.query.no_requirements.length > 0) {
            if (typeof (req.query.no_requirements) === 'string') {
                req.query.no_requirements = parseInt(req.query.no_requirements, 10);
            }
            condition.no_requirements = req.query.no_requirements;
        }

        if (req.query.experience_range_id && req.query.experience_range_id.length > 0) {
            condition['experience_range._id'] = ObjectId(req.query.experience_range_id);
        }

        if (req.query.client_id && req.query.client_id.length > 0) {
            condition.client_id = ObjectId(req.query.client_id);
        }

        if (req.query.techskills) {
            const techskillsArr = req.query.techskills.split(',');
            condition['primary_skills.skill'] = ({ $in: techskillsArr });
        }
        // !

        // const projectData = await Projects.find(condition)
        //     .select('_id project_id role primary_skills experience_range no_requirements month_of_engagement client_price ss_price')
        //     .select('client_name client_id sales_poc  expectations createdAt')
        //     .select('client_poc._id client_poc.email client_poc.mobile_number client_poc.client_poc')
        //     .skip(offset)
        //     .limit(limit)
        //     .sort({ updatedAt: -1, createdAt: -1 });

        const projectData = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $lookup:
                {
                    from: 'clients',
                    localField: 'client_id',
                    foreignField: '_id',
                    as: 'client_info',
                },
            },
            {
                $project: {
                    _id: 1,
                    role: 1,
                    primary_skills: 1,
                    client_id: 1,
                    client_name: 1,
                    createdAt: 1,
                    experience_range: 1,
                    client_price: 1,
                    working_hours: 1,
                    interview_rounds: 1,
                    communication_skill: 1,
                    client_poc: 1,
                    ss_price: 1,
                    month_of_engagement: 1,
                    engagement_type: 1,
                    tentative_start: 1,
                    expectations: 1,
                    secondary_skills: 1,
                    working_time_zone: 1,
                    travel_preference: 1,
                    city_preference: 1,
                    tools_used: 1,
                    system_provided: 1,
                    job_responsibility: 1,
                    location: 1,
                    project_id: 1,
                    no_requirements: 1,
                    interested_count: 1,
                    interviewing_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    job_status: 1,
                    job_status_date: 1,
                    updatedAt: 1,
                    type: 1,
                    talent_manager_associate: 1,
                    sales_poc: 1,

                    is_world_wide: 1,
                    'client_info._id': 1,
                    'client_info.name': 1,
                    'client_info.about_company': 1,
                    status: 1,
                },
            },
        ]);

        const projectCount = await Projects.find(condition).countDocuments();

        // -------------- Display jobs count in list start------------------//
        const jobs2 = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $group: {
                    _id: null,
                    jobIds: { $push: '$_id' },
                },
            },
            {
                $project: {
                    _id: 1,
                    jobIds: 1,
                },
            },
        ]);

        if (jobs2.length > 0) {
            const jobIds = jobs2[0].jobIds.map((objId) => objId.toString());

            const developerInterestCount = await request.post(
                {},
                'jobs-interaction-service',
                '/job-interaction-v2/jobs-count',
                {
                    project_id: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );

            for (let i = 0; i < projectData.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.jobHeaderCount.length; j += 1) {
                    if (projectData[i]._id.toString() === developerInterestCount.data.data.jobHeaderCount[j].project_id) {
                        projectData[i].job_counts = {
                            applied: {
                                appliedDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interested_total_count, 10) : 0,
                                outboundDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].outbound_total_count, 10) : 0,
                            },
                            shortListed: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].shortlisted_count, 10) : 0,
                            vetting: {
                                skillVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].skill_vetting_count, 10) : 0,
                                verification: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].verification_count, 10) : 0,
                                hrVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].hr_vetting_count, 10) : 0,
                            },
                            interviews: [
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round1, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round2, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round3, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round4, 10) : 0,
                                },
                            ],
                            hired: {
                                selected: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_count, 10) : 0,
                                offerSent: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_send_count, 10) : 0,
                            },
                            clientOnboarding: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_accepted_count, 10) : 0,
                            rejected: {
                                movedToBenchpool: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].benchpool_count, 10) : 0,
                                reject: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].rejected_count, 10) : 0,
                            },
                        };
                    }
                }
            }
        }
        // -------------- Display jobs count in list ends------------------//

        const responseData = {
            projectData,
            total: projectCount,
        };

        return globalCalls.successData('Open Jobs found successfully', responseData);
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 04-04-2023
 * Function:
 * API: projects/
 * Method: GET
 * Description: To show all closed job
 */
const closedJobs = async (req, res) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);

        const condition = {
            platform_type: 'pre-hire',
            job_status: { $in: ['Win', 'Loss'] },
        };

        if (res.tokenData.user_role === 'tp_associate') {
            condition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
        }

        // !
        // -------------- Filter start ------------------//
        if (req.query.search) {
            const { search } = req.query;
            condition.$or = [{ job_title: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim()}.*` } }, { type: { $regex: `.*${search.trim()}.*` } }];
        }

        if (req.query._id && req.query._id.length > 0) {
            condition._id = ObjectId(req.query._id);
        }

        if (req.query.search && req.query.search.length > 0) {
            condition.$or = [{ client_name: { $regex: `.*${req.query.search.trim()}.*` } }, { project_id: { $regex: `.*${req.query.search.trim().toUpperCase()}.*` } }];
        }

        if (req.query.roles) {
            const roleArr = req.query.roles.split(',');
            condition['role.role'] = ({ $in: roleArr });
        }

        if (req.query.no_requirements && req.query.no_requirements.length > 0) {
            if (typeof (req.query.no_requirements) === 'string') {
                req.query.no_requirements = parseInt(req.query.no_requirements, 10);
            }
            condition.no_requirements = req.query.no_requirements;
        }

        if (req.query.experience_range_id && req.query.experience_range_id.length > 0) {
            condition['experience_range._id'] = ObjectId(req.query.experience_range_id);
        }

        if (req.query.client_id && req.query.client_id.length > 0) {
            condition.client_id = ObjectId(req.query.client_id);
        }

        if (req.query.techskills) {
            const techskillsArr = req.query.techskills.split(',');
            condition['primary_skills.skill'] = ({ $in: techskillsArr });
        }
        // !

        /* const projectData = await Projects.find(condition)
            .select('_id project_id role primary_skills experience_range no_requirements month_of_engagement talent_manager_associate')
            .select('client_name client_id sales_poc  expectations createdAt updatedAt')
            .select('client_poc._id client_poc.email client_poc.mobile_number client_poc.client_poc')
            .skip(offset)
            .limit(limit)
            .sort({ updatedAt: -1, createdAt: -1 }); */

        const projectData = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $lookup:
                {
                    from: 'clients',
                    localField: 'client_id',
                    foreignField: '_id',
                    as: 'client_info',
                },
            },
            {
                $project: {
                    _id: 1,
                    role: 1,
                    primary_skills: 1,
                    client_id: 1,
                    client_name: 1,
                    createdAt: 1,
                    experience_range: 1,
                    client_price: 1,
                    working_hours: 1,
                    interview_rounds: 1,
                    communication_skill: 1,
                    client_poc: 1,
                    ss_price: 1,
                    month_of_engagement: 1,
                    engagement_type: 1,
                    tentative_start: 1,
                    expectations: 1,
                    secondary_skills: 1,
                    working_time_zone: 1,
                    travel_preference: 1,
                    city_preference: 1,
                    tools_used: 1,
                    system_provided: 1,
                    job_responsibility: 1,
                    location: 1,
                    project_id: 1,
                    no_requirements: 1,
                    interested_count: 1,
                    interviewing_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    job_status: 1,
                    job_status_date: 1,
                    updatedAt: 1,
                    type: 1,
                    talent_manager_associate: 1,
                    sales_poc: 1,

                    is_world_wide: 1,
                    'client_info._id': 1,
                    'client_info.name': 1,
                    'client_info.about_company': 1,
                },
            },
        ]);

        const projectCount = await Projects.find(condition).countDocuments();

        // -------------- Display jobs count in list start------------------//
        const jobs2 = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $group: {
                    _id: null,
                    jobIds: { $push: '$_id' },
                },
            },
            {
                $project: {
                    _id: 1,
                    jobIds: 1,
                },
            },
        ]);

        if (jobs2.length > 0) {
            const jobIds = jobs2[0].jobIds.map((objId) => objId.toString());

            const developerInterestCount = await request.post(
                {},
                'jobs-interaction-service',
                '/job-interaction-v2/jobs-count',
                {
                    project_id: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );

            for (let i = 0; i < projectData.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.jobHeaderCount.length; j += 1) {
                    if (projectData[i]._id.toString() === developerInterestCount.data.data.jobHeaderCount[j].project_id) {
                        projectData[i].job_counts = {
                            applied: {
                                appliedDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interested_total_count, 10) : 0,
                                outboundDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].outbound_total_count, 10) : 0,
                            },
                            shortListed: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].shortlisted_count, 10) : 0,
                            vetting: {
                                skillVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].skill_vetting_count, 10) : 0,
                                verification: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].verification_count, 10) : 0,
                                hrVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].hr_vetting_count, 10) : 0,
                            },
                            interviews: [
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round1, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round2, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round3, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round4, 10) : 0,
                                },
                            ],
                            hired: {
                                selected: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_count, 10) : 0,
                                offerSent: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_send_count, 10) : 0,
                            },
                            clientOnboarding: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_accepted_count, 10) : 0,
                            rejected: {
                                movedToBenchpool: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].benchpool_count, 10) : 0,
                                reject: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].rejected_count, 10) : 0,
                            },
                        };
                    }
                }
            }
        }
        // -------------- Display jobs count in list ends------------------//

        const responseData = {
            projectData,
            total: projectCount,
        };

        return globalCalls.successData('Closed Jobs found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 04-04-2023
 * Function:
 * API: projects/
 * Method: GET
 * Description: To show all onHold job
 */
const onHoldJobs = async (req, res) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);

        const condition = {
            platform_type: 'pre-hire',
            job_status: { $in: ['On-Hold'] },
        };

        if (res.tokenData.user_role === 'tp_associate') {
            condition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
        }

        // !
        // -------------- Filter start ------------------//
        if (req.query.search) {
            const { search } = req.query;
            condition.$or = [{ job_title: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim()}.*` } }, { type: { $regex: `.*${search.trim()}.*` } }];
        }

        if (req.query._id && req.query._id.length > 0) {
            condition._id = ObjectId(req.query._id);
        }

        if (req.query.search && req.query.search.length > 0) {
            condition.$or = [{ client_name: { $regex: `.*${req.query.search.trim()}.*` } }, { project_id: { $regex: `.*${req.query.search.trim().toUpperCase()}.*` } }];
        }

        if (req.query.roles) {
            const roleArr = req.query.roles.split(',');
            condition['role.role'] = ({ $in: roleArr });
        }

        if (req.query.no_requirements && req.query.no_requirements.length > 0) {
            if (typeof (req.query.no_requirements) === 'string') {
                req.query.no_requirements = parseInt(req.query.no_requirements, 10);
            }
            condition.no_requirements = req.query.no_requirements;
        }

        if (req.query.experience_range_id && req.query.experience_range_id.length > 0) {
            condition['experience_range._id'] = ObjectId(req.query.experience_range_id);
        }

        if (req.query.client_id && req.query.client_id.length > 0) {
            condition.client_id = ObjectId(req.query.client_id);
        }

        if (req.query.techskills) {
            const techskillsArr = req.query.techskills.split(',');
            condition['primary_skills.skill'] = ({ $in: techskillsArr });
        }
        // !

        /* const projectData = await Projects.find(condition)
            .select('_id project_id role primary_skills experience_range no_requirements month_of_engagement talent_manager_associate')
            .select('client_name client_id sales_poc  expectations createdAt updatedAt')
            .select('client_poc._id client_poc.email client_poc.mobile_number client_poc.client_poc')
            .skip(offset)
            .limit(limit)
            .sort({ updatedAt: -1, createdAt: -1 }); */

        const projectData = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $lookup:
                {
                    from: 'clients',
                    localField: 'client_id',
                    foreignField: '_id',
                    as: 'client_info',
                },
            },
            {
                $project: {
                    _id: 1,
                    role: 1,
                    primary_skills: 1,
                    client_id: 1,
                    client_name: 1,
                    createdAt: 1,
                    experience_range: 1,
                    client_price: 1,
                    working_hours: 1,
                    interview_rounds: 1,
                    communication_skill: 1,
                    client_poc: 1,
                    ss_price: 1,
                    month_of_engagement: 1,
                    engagement_type: 1,
                    tentative_start: 1,
                    expectations: 1,
                    secondary_skills: 1,
                    working_time_zone: 1,
                    travel_preference: 1,
                    city_preference: 1,
                    tools_used: 1,
                    system_provided: 1,
                    job_responsibility: 1,
                    location: 1,
                    project_id: 1,
                    no_requirements: 1,
                    interested_count: 1,
                    interviewing_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    job_status: 1,
                    job_status_date: 1,
                    updatedAt: 1,
                    type: 1,
                    talent_manager_associate: 1,
                    sales_poc: 1,

                    is_world_wide: 1,
                    'client_info._id': 1,
                    'client_info.name': 1,
                    'client_info.about_company': 1,
                },
            },
        ]);

        const projectCount = await Projects.find(condition).countDocuments();

        // -------------- Display jobs count in list start------------------//
        const jobs2 = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $group: {
                    _id: null,
                    jobIds: { $push: '$_id' },
                },
            },
            {
                $project: {
                    _id: 1,
                    jobIds: 1,
                },
            },
        ]);

        if (jobs2.length > 0) {
            const jobIds = jobs2[0].jobIds.map((objId) => objId.toString());

            const developerInterestCount = await request.post(
                {},
                'jobs-interaction-service',
                '/job-interaction-v2/jobs-count',
                {
                    project_id: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );

            for (let i = 0; i < projectData.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.jobHeaderCount.length; j += 1) {
                    if (projectData[i]._id.toString() === developerInterestCount.data.data.jobHeaderCount[j].project_id) {
                        projectData[i].job_counts = {
                            applied: {
                                appliedDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interested_total_count, 10) : 0,
                                outboundDeveloper: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].outbound_total_count, 10) : 0,
                            },
                            shortListed: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].shortlisted_count, 10) : 0,
                            vetting: {
                                skillVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].skill_vetting_count, 10) : 0,
                                verification: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].verification_count, 10) : 0,
                                hrVetting: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].hr_vetting_count, 10) : 0,
                            },
                            interviews: [
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round1, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round2, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round3, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].interview_round4, 10) : 0,
                                },
                            ],
                            hired: {
                                selected: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_count, 10) : 0,
                                offerSent: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_send_count, 10) : 0,
                            },
                            clientOnboarding: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].selected_accepted_count, 10) : 0,
                            rejected: {
                                movedToBenchpool: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].benchpool_count, 10) : 0,
                                reject: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data.jobHeaderCount[j].rejected_count, 10) : 0,
                            },
                        };
                    }
                }
            }
        }
        // -------------- Display jobs count in list ends------------------//

        const responseData = {
            projectData,
            total: projectCount,
        };

        return globalCalls.successData('on hold Jobs found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 04-04-2023
 * Function:
 * API: projects/
 * Method: GET
 * Description: To show all header count of job
 */
// eslint-disable-next-line no-unused-vars
const jobsHeaderCount = async (req, res) => {
    try {
        const openCondition = {
            platform_type: 'pre-hire',
            status: 'open',
            job_status: { $nin: ['Win', 'Loss', 'On-Hold'] },
        };

        const closeCondition = {
            platform_type: 'pre-hire',
            job_status: { $in: ['Win', 'Loss'] },
        };

        const assignedCondition = {
            platform_type: 'pre-hire',
            status: 'assigned',
            job_status: { $nin: ['Win', 'Loss', 'On-Hold'] },
        };

        const onHoldCondition = {
            platform_type: 'pre-hire',
            job_status: 'On-Hold',
        };

        if (res.tokenData.user_role === 'tp_associate') {
            closeCondition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
            assignedCondition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
            onHoldCondition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
        }

        const headerCounts = await Projects.aggregate([
            {
                $facet: {
                    open_count: [
                        {
                            $match: openCondition,
                        },
                        { $count: 'count' },
                    ],
                    closed_count: [
                        {
                            $match: closeCondition,
                        },
                        { $count: 'count' },
                    ],
                    assigned_count: [
                        {
                            $match: assignedCondition,
                        },
                        { $count: 'count' },
                    ],
                    onhold_count: [
                        {
                            $match: onHoldCondition,
                        },
                        { $count: 'count' },
                    ],
                    requirements_count: [
                        {
                            $match: { job_status: { $nin: ['Win', 'Loss'] }, platform_type: 'pre-hire' },
                        },
                        {
                            $group: {
                                _id: 0, requirements: { $sum: '$no_requirements' },
                            },
                        },
                    ],
                },
            },
            {
                $project: {
                    open_count: { $ifNull: [{ $first: '$open_count.count' }, 0] },
                    closed_count: { $ifNull: [{ $first: '$closed_count.count' }, 0] },
                    assigned_count: { $ifNull: [{ $first: '$assigned_count.count' }, 0] },
                    onhold_count: { $ifNull: [{ $first: '$onhold_count.count' }, 0] },
                    requirements_count: { $ifNull: [{ $first: '$requirements_count.requirements' }, 0] },
                },
            },
        ]);
        let developerPlaced = await request.post(
            {},
            'jobs-interaction-service',
            '/job-interaction/get-user-count-wherein-status-wise',
            {
                status: ['selected', 'hired'],
            },
            { headers: { Authorization: req.headers.authorization } },
        );

        developerPlaced = await developerPlaced && developerPlaced.data && developerPlaced.data.data && developerPlaced.data.data.count ? developerPlaced.data.data.count : 0;
        const responseData = headerCounts[0];
        responseData.developer_placed = parseInt(developerPlaced, 10);
        return globalCalls.successData('Jobs header count', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 05-04-2023
 * Function:
 * API: projects/
 * Method: POST
 * Description: To assign Talent Manager Associate
 */
const assignTalentManagerAssociate = async (data, auth) => {
    try {
        const validatetalentManagerAssociate = await validator.talentManagerAssociate.validate(data);
        if (validatetalentManagerAssociate && validatetalentManagerAssociate.error && validatetalentManagerAssociate.error.details[0]) return globalCalls.badRequestError(validatetalentManagerAssociate.error.details[0].message);

        const projectId = data.project_id;
        // eslint-disable-next-line no-param-reassign
        delete data.project_id; data.createdAt = new Date();

        const job = await Projects.findById(projectId).select('project_id job_status status talent_manager_associate');
        if (!job) {
            return globalCalls.badRequestError('Job not exist');
        } else if (job.status !== 'open') {
            return globalCalls.badRequestError('Not an open job');
        } else if (job.job_status) { // For old jobs
            return globalCalls.badRequestError('Job is not open');
        } else if (job.talent_manager_associate.length > 0) {
            return globalCalls.badRequestError('Talent manager associate already assigned');
        }
        const saveAssociate = await Projects.updateOne(
            { _id: ObjectId(projectId) },
            {
                $set: { status: 'assigned', platform_type: 'pre-hire' },
                $addToSet: { talent_manager_associate: data },
            },
        );
        if (saveAssociate.modifiedCount <= 0) {
            return globalCalls.badRequestError('Error in assigning talent manager associate');
        } else {
            // ----------------------------- SNS code start ------------------------------------ //
            const snsResponseData = { team_member_id: data.talent_associate_id, job_id: projectId, job_status: 'assigned' };
            // messageHub.publish(process.env.SNS_OUT_TOPIC_ARN, JSON.stringify({ ...snsResponseData, event: 'job_assigned' }));
            // ------------------------------ SNS code end ------------------------------------- //
            // below code is till sns not working
            await request.post({}, 'team-management-service', '/assigned-jobs', snsResponseData, { headers: { Authorization: auth } });
            return globalCalls.successData('Talent manager associate assigned successfully', 'responseData');
        }
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/*
 * Created By: Shubhankar Kesharwani
 * Created Date: 04-04-2023
 * Function Name: updateOpenHoldJobsStatus
 * API: projects/move-jobs
 * Method: PUT
 * Description: Update job Open and Hold Jobs Status.//
 */

const updateOpenHoldJobsStatus = async (jobId, data) => {
    try {
        const validateJobStatus = await validator.jobHoldOpenValidation.validate(data);
        if (validateJobStatus && validateJobStatus.error && validateJobStatus.error.details[0]) return globalCalls.badRequestError(validateJobStatus.error.details[0].message);
        const updateData = {};
        if (data.status === 'On-Hold') {
            updateData.job_status = 'On-Hold';
        } else {
            updateData.job_status = null;
        }
        const updateStatus = await Projects.findByIdAndUpdate(jobId, updateData);
        if (!updateStatus) {
            return globalCalls.badRequestError('Something went wrong, while moving job');
        }

        const interactionUpdateData = { job_status: updateData.job_status };
        await request.put({}, 'jobs-interaction-service', `/job-interaction/axios-job-status-update/${jobId}`, interactionUpdateData, {});
        return globalCalls.successData('Job moved successfully', []);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 14-04-2023
 * Function:
 * API: projects/reAssignTalentManagerAssociate
 * Method: PUT
 * Description: To re-assign Talent Manager Associate
 */
const reAssignTalentManagerAssociate = async (data, auth) => {
    try {
        const validatetalentManagerAssociate = await validator.talentManagerAssociate.validate(data);
        if (validatetalentManagerAssociate && validatetalentManagerAssociate.error && validatetalentManagerAssociate.error.details[0]) return globalCalls.badRequestError(validatetalentManagerAssociate.error.details[0].message);

        const projectId = data.project_id;
        // eslint-disable-next-line no-param-reassign
        delete data.project_id; data.createdAt = new Date();

        const job = await Projects.findById(projectId).select('project_id job_status status talent_manager_associate');
        if (!job) {
            return globalCalls.badRequestError('Job not exist');
        } else if (job.status !== 'assigned') {
            return globalCalls.badRequestError('Not an assigned job');
        } else if (job.talent_manager_associate.length <= 0) {
            return globalCalls.badRequestError('Talent manager associate not assigned yet');
        }
        const saveAssociate = await Projects.updateOne(
            { _id: ObjectId(projectId) },
            {
                $set: { talent_manager_associate: data },
            },
        );
        if (saveAssociate.modifiedCount <= 0) {
            return globalCalls.badRequestError('Error in assigning talent manager associate');
        } else {
            // ----------------------------- SNS code start ------------------------------------ //
            const snsResponseData = { team_member_id: data.talent_associate_id, job_id: projectId, job_status: 'assigned' };
            // messageHub.publish(process.env.SNS_OUT_TOPIC_ARN, JSON.stringify({ ...snsResponseData, event: 'job_assigned' }));
            // ------------------------------ SNS code end ------------------------------------- //
            // below code is till sns not working
            await request.post({}, 'team-management-service', '/assigned-jobs', snsResponseData, { headers: { Authorization: auth } });
            return globalCalls.successData('Talent manager associate re-assigned successfully', 'responseData');
        }
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

const getJobAccordingToTimeInterval = async (startDate, endDate, platformType = 'pre-hire', type = 'premium-job') => {
    try {
        // to accept the date format of dashboard api
        const endDate1 = endDate ? new Date(endDate) : new Date();
        const startDate1 = startDate || new Date();
        if (!startDate) startDate1.setDate(startDate1.getDate() - 30);
        // if (endDate) endDate1.setDate(endDate1.getDate());

        console.log('start date', startDate1, 'end date', endDate1);

        // const Date1 = new Date(startDate);
        // const Date2 = new Date(endDate);
        // for including the records of end date till 23:59
        endDate1.setHours(23, 59, 59, 999);
        const getJobCounts = await Projects.find({
            createdAt: { $gte: startDate1, $lte: endDate1 },
            platform_type: platformType,
            type,
        }).select('_id').lean();
        const ids = getJobCounts.map((jobs) => jobs._id);
        const responseData = {
            counts: getJobCounts.length,
            ids,
        };
        return globalCalls.successData('Jobs found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 14-04-2023
 * Function Name: apiForOneTimeRemoveATS
 * API: projects/remove-ats-jobs
 * Method: POST
 * Description: To differ ats and super product jobs.
 */

const apiForOneTimeRemoveATSJobs = async () => {
    try {
        let responseData;
        const getAllData = await Projects.find()
            // .where({
            //     $or: [
            //         { type: 'premium-job' },
            //         // { type: { $exists: false } },
            //     ],
            // });
            .where({
                type: 'premium-job',
                platform_type: 'pre-hire',
                talent_manager_associate: { $exists: true },
            });

        console.log(getAllData.length);
        for (let i = 0; i < getAllData.length; i += 1) {
            console.log(getAllData[i]._id, ' count = ', i);
            // responseData = await Projects.updateMany(
            //     { _id: ObjectId(getAllData[i]._id) },
            //     { $set: { type: 'premium-job', platform_type: 'pre-hire' } },
            // );
            responseData = await Projects.updateMany(
                { _id: ObjectId(getAllData[i]._id) },
                { $set: { status: 'assigned' } },
            );
        }
        return globalCalls.checkResponse(200, responseData, 'success');
    } catch (error) {
        console.log(error.stack);
    }
};

const getJobsCountForOpeningCloser = async (startDate, endDate, platformType = 'pre-hire', type = 'premium-job') => {
    try {
        const endDate1 = endDate ? new Date(endDate) : new Date();
        const startDate1 = startDate || new Date();
        if (!startDate) startDate1.setDate(startDate1.getDate() - 30);
        // if (endDate) endDate1.setDate(endDate1.getDate());

        console.log('start date', startDate1, 'end date', endDate1);
        endDate1.setHours(23, 59, 59, 999);

        const getOpenJobsCount = await Projects.countDocuments({
            createdAt: { $gte: startDate1, $lte: endDate1 }, status: 'open', platform_type: platformType, type,
        });
        const getCloseJobsCount = await Projects.countDocuments({
            createdAt: { $gte: startDate1, $lte: endDate1 }, status: 'open', job_status: { $in: ['Win', 'Loss'] }, platform_type: platformType, type,
        });

        const getWinJobsCount = await Projects.countDocuments({
            createdAt: { $gte: startDate1, $lte: endDate1 }, status: 'open', job_status: 'Win', platform_type: platformType, type,
        });

        const getLossJobsCount = await Projects.countDocuments({
            createdAt: { $gte: startDate1, $lte: endDate1 }, status: 'open', job_status: 'Loss', platform_type: platformType, type,
        });

        const successPercentage = ((getWinJobsCount / getOpenJobsCount) * 100).toFixed(2);
        const lossPercentage = ((getLossJobsCount / getOpenJobsCount) * 100).toFixed(2);

        console.log(getOpenJobsCount);
        console.log(getWinJobsCount);
        console.log(getLossJobsCount);

        const response = {
            successPercentage: parseFloat(successPercentage),
            lossPercentage: parseFloat(lossPercentage),
            closeJobCount: getCloseJobsCount,
        };
        return globalCalls.successData('Jobs counts fetched successfully', response);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 24-04-2023
 * Desc: To get some fileds of project information
 * Function: getFewDetailsOfProject
 * Api: /get-info/:id
 */
const getFewDetailsOfProject = async (id) => {
    try {
        const condition = { _id: ObjectId(id), type: 'premium-job' };

        const getDetailProject = await Projects.aggregate([
            {
                $match: condition,
            },
            {
                $project: {
                    _id: 0,
                    client_price: 1,
                    ss_price: 1,
                },
            },
        ]);

        if (getDetailProject && getDetailProject.length > 0) {
            return globalCalls.checkResponse(200, getDetailProject, 'Job info found successfully');
        } else {
            return globalCalls.badRequestError('Error, while finding the project');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const jobDetailForDashboard = async (jobArr) => {
    try {
        console.log(jobArr);
        const jobs = await Projects.find({ _id: { $in: jobArr } }, {
            _id: 1,
            client_id: 1,
            client_name: 1,
            client_poc: 1,
            role: 1,
            experience_range: 1,
            client_price: 1,
            ss_price: 1,
            month_of_engagement: 1,
            engagement_type: 1,
            no_requirements: 1,
            tentative_start: 1,
            expectations: 1,
            secondary_skills: 1,
            primary_skills: 1,
            competency: 1,
            no_of_rounds: 1,
            job_responsibility: 1,
            interview_rounds: 1,
            communication_skill: 1,
            createdAt: 1,
            project_id: 1,
            type: 1,
        });

        return globalCalls.successData('Job detail found successfully', jobs);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const getJobDetailsAccordingToTimeInterval = async (startDate, endDate, platformType = 'pre-hire', type = 'premium-job') => {
    try {
        // to accept the date format of dashboard api
        const endDate1 = endDate ? new Date(endDate) : new Date();
        const startDate1 = startDate || new Date();
        if (!startDate) startDate1.setDate(startDate1.getDate() - 30);
        // if (endDate) endDate1.setDate(endDate1.getDate());

        console.log('start date', startDate1, 'end date', endDate1);
        // for including the records of end date till 23:59
        endDate1.setHours(23, 59, 59, 999);
        // Group data by week days
        const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const groupedData = {};
        weekDays.forEach((weekDay) => {
            groupedData[weekDay] = { posted: 0, closed: 0 };
        });
        const getJobDetails = await Projects.find({
            createdAt: { $gte: startDate1, $lte: endDate1 },
            platform_type: platformType,
            type,
        }).select('_id status job_status createdAt').lean();

        getJobDetails.forEach((job) => {
            const weekDay = weekDays[new Date(job.createdAt).getDay()];
            if (job.job_status === 'Win' || job.job_status === 'Loss') {
                groupedData[weekDay].closed += 1;
            } else {
                groupedData[weekDay].posted += 1;
            }
        });

        return globalCalls.successData('Jobs found successfully', groupedData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

module.exports = {
    assignedJobsList,
    openJobs,
    closedJobs,
    onHoldJobs,
    jobsHeaderCount,
    assignTalentManagerAssociate,
    updateOpenHoldJobsStatus,
    reAssignTalentManagerAssociate,
    getJobAccordingToTimeInterval,
    apiForOneTimeRemoveATSJobs,
    getJobsCountForOpeningCloser,
    getFewDetailsOfProject,
    jobDetailForDashboard,
    getJobDetailsAccordingToTimeInterval,
};
