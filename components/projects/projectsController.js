const RequestMap = require('@mayank_supersourcing/request-map');
// const crypto = require('crypto');
const { ObjectId } = require('mongodb');
// const { base64decode } = require('nodejs-base64');
const { Projects } = require('./projectsModel');
const JobSettings = require('./projectsModel').jobSettings;
const globalCalls = require('../../utils/functions');
const globalConst = require('../../config/constants');
const {
    addJobs, jobStatusValidation, addJobsATS, jobSettingsValidate,
} = require('./projectsValidation');
const { base64encode, base64decode } = require('nodejs-base64');
const { Endpoint } = require('aws-sdk');

const request = new RequestMap({ environment: process.env.ENVIRONMENT });

/**
 * Created By: Piyush Bhangale
 * Created Date: 01-09-2022
 * Desc: To create project for particular client
 * Function: create
 * Api: project/:id
 */

const create = async (clientId, body) => {
    try {
        const addData = body;
        const validateAddJob = await addJobs.validate(addData);
        if (validateAddJob && validateAddJob.error && validateAddJob.error.details[0]) return globalCalls.badRequestError(validateAddJob.error.details[0].message);
        addData.interested_count = 0;
        addData.interviewing_count = 0;
        addData.hired_count = 0;
        addData.rejected_count = 0;
        addData.shortlisted_count = 0;
        addData.client_id = clientId;

        if (addData.is_world_wide === true) {
            delete addData.location;
            delete addData.job_city;
        }
        addData.type = 'premium-job';
        addData.rand_no = Math.floor(Math.random() * (100 - 50 + 1) + 50);
        const addProject = await Projects(addData).save();
        if (addProject) {
            return globalCalls.checkResponse(200, addProject, 'Client project added successfully');
        } else {
            return globalCalls.badRequestError('Error, while adding the project');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const postJobATS = async (data, res) => {
    try {
        // const generateSecretKey = () => crypto.randomBytes(15).toString('hex');
        // const secretKey = generateSecretKey();
        // // console.log(`Generated secret key: ${secretKey}`);

        let saveData = {};
        saveData = data;
        saveData.platform_type = 'super-hire';
        if (!data.project_status) {
            return globalCalls.badRequestError('Please pass project status');
        } else if (data.project_status == 'draft') {
            return globalCalls.badRequestError('Sorry! You have passed wrong project status');
        }

        if (data.type === 'ats-fulltime') {
            saveData.max_salary_range = data.max_salary_range;
            saveData.min_salary_range = data.min_salary_range;
            saveData.max_exp_range = data.max_exp_range;
            saveData.min_exp_range = data.min_exp_range;
        }
        if (data.type === 'ats-internship') {
            saveData.stipend = data.stipend;
            if (data.stipend === true) {
                saveData.stipend_amount = data.stipend_amount;
            }
        }
        if (data.type === 'ats-contract') {
            saveData.project_duration = data.project_duration;
            saveData.project_salary = data.project_salary;
        }
        if (data.travel_preference) {
            if (data.travel_preference.data === 'Onsite' && data.travel_preference.data === 'Hybrid') {
                saveData.preffered_location = data.preffered_location;
            }
        }
        if (data.interview_rounds_ats) {
            if (data.interview_rounds_ats.rejction_process === 'automatic') {
                saveData.interview_rounds_ats.rejction_process = data.interview_rounds_ats.rejction_process;
            }
        }
        saveData.currency = data.currency;
        // const validateAddJob = await addJobsATS.validate(saveData);
        // if (validateAddJob && validateAddJob.error && validateAddJob.error.details[0]) return globalCalls.badRequestError(validateAddJob.error.details[0].message);

        // saveData.secret_access_key = secretKey;
        // saveData.tenant_id = res.tokenData.user_id;
        if (!saveData._id) {
            if (res.tokenData.user_id) saveData.ats_user_id = res.tokenData.user_id;
            if (res.tokenData.ats_admin_id) saveData.ats_admin_id = res.tokenData.ats_admin_id;
            else saveData.ats_admin_id = res.tokenData.user_id;
            if (res.tokenData.tenant_id) saveData.ats_tenant_id = res.tokenData.tenant_id;
            else {
                const ctx = {};
                const requestConfig = {};
                const service = 'user-management-service';
                const path = '/engineers/get-tenant-id-axios-session-update/'+base64encode(String(res.tokenData.user_id));
                const response = await request.get(ctx, service, path, requestConfig);
                const tenantData = response.data ? response.data.data : [];
                if (tenantData) {
                    if (tenantData.userInfo && tenantData.userInfo.ats_tenant_id) {
                        saveData.ats_tenant_id = tenantData.userInfo.ats_tenant_id;
                    } else return globalCalls.badRequestError('Please add organization details before posting job.');
                } else return globalCalls.badRequestError('Please add organization details before posting job.');
            }
        }

        let saveProject = {};
        if (saveData._id) {
            const id = ObjectId(saveData._id);
            const checkProjectData = await Projects.findById(saveData._id);
            // console.log(checkOrgData)
            if (!checkProjectData || checkProjectData == null) {
                return globalCalls.badRequestError('Sorry! Job data not found');
            }
            // else if (checkProjectData.project_status && checkProjectData.project_status == "posted") {
            //     return globalCalls.badRequestError("Sorry! Job data is already posted, You can't edit now.");
            // }

            delete saveData._id;
            const isSaved = await Projects.findOneAndUpdate(id, saveData);
            if (isSaved) {
                saveProject = await Projects.findById(id);
            } else {
                return globalCalls.badRequestError('Sorry! job data not updated');
            }
        } else {
            const validateAddJob = await addJobsATS.validate(saveData);
            if (validateAddJob && validateAddJob.error && validateAddJob.error.details[0]) return globalCalls.badRequestError(validateAddJob.error.details[0].message);

            saveProject = await Projects(saveData).save();
        }
        if (!saveProject) {
            return globalCalls.badRequestError('Something went wrong, while saving the project');
        } else {
            return globalCalls.successData('ATS project saved successfully', saveProject);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const draftJobATS = async (data, res) => {
    try {
        // const generateSecretKey = () => crypto.randomBytes(15).toString('hex');
        // const secretKey = generateSecretKey();
        // // console.log(`Generated secret key: ${secretKey}`);

        let saveData = {};
        saveData = data;
        saveData.platform_type = 'super-hire';
        if (!data.project_status) {
            return globalCalls.badRequestError('Please pass project status');
        } else if (data.project_status == 'posted') {
            return globalCalls.badRequestError('Sorry! You have passed wrong project status');
        }

        if (data.type === 'ats-fulltime') {
            saveData.max_salary_range = data.max_salary_range;
            saveData.min_salary_range = data.min_salary_range;
            saveData.max_exp_range = data.max_exp_range;
            saveData.min_exp_range = data.min_exp_range;
        }
        if (data.type === 'ats-internship') {
            saveData.stipend = data.stipend;
            if (data.stipend === true) {
                saveData.stipend_amount = data.stipend_amount;
            }
        }
        if (data.type === 'ats-contract') {
            saveData.project_duration = data.project_duration;
            saveData.project_salary = data.project_salary;
        }
        if (data.travel_preference) {
            if (data.travel_preference.data === 'Onsite' && data.travel_preference.data === 'Hybrid') {
                saveData.preffered_location = data.preffered_location;
            }
        }
        if (data.interview_rounds_ats) {
            if (data.interview_rounds_ats.rejction_process === 'automatic') {
                saveData.interview_rounds_ats.rejction_process = data.interview_rounds_ats.rejction_process;
            }
        }

        saveData.currency = data.currency;
        if (res.tokenData.user_id) saveData.ats_user_id = res.tokenData.user_id;
        if (res.tokenData.ats_admin_id) saveData.ats_admin_id = res.tokenData.ats_admin_id;
        else saveData.ats_admin_id = res.tokenData.user_id;
        if (res.tokenData.tenant_id) saveData.ats_tenant_id = res.tokenData.tenant_id;
        else {
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = '/engineers/get-tenant-id-axios-session-update/'+base64encode(String(res.tokenData.user_id));
            const response = await request.get(ctx, service, path, requestConfig);
            const tenantData = response.data ? response.data.data : [];
            if (tenantData) {
                if (tenantData.userInfo && tenantData.userInfo.ats_tenant_id) {
                    saveData.ats_tenant_id = tenantData.userInfo.ats_tenant_id;
                } else return globalCalls.badRequestError('Please add organization details before posting job.');
            } else return globalCalls.badRequestError('Please add organization details before posting job.');
        }

        let saveProject = {};
        if (saveData._id) {
            const id = ObjectId(saveData._id);
            const checkProjectData = await Projects.findById(saveData._id);
            // console.log(checkOrgData)
            if (!checkProjectData || checkProjectData == null) {
                return globalCalls.badRequestError('Sorry! Job data not found');
            } else if (checkProjectData.project_status && checkProjectData.project_status == 'posted') {
                return globalCalls.badRequestError("Sorry! Job data is already posted, You can't edit now.");
            }

            delete saveData._id;
            const isSaved = await Projects.findOneAndUpdate(id, saveData);
            if (isSaved) {
                saveProject = await Projects.findById(id);
            } else {
                return globalCalls.badRequestError('Sorry! job data not updated');
            }
        } else {
            saveProject = await Projects(saveData).save();
        }

        if (!saveProject) {
            return globalCalls.badRequestError('Something went wrong, while saving the project');
        } else {
            return globalCalls.successData('ATS project saved successfully', saveProject);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Piyush Bhangale
 * Created Date: 01-09-2022
 * Desc: To get list of all project
 * Function: list
 * Api: /project
 */

const list = async (filters = {}, limit = 20, page = 1) => {
    const myAggregate = Projects.aggregate([
        {
            $lookup:
            {
                from: 'clients',
                localField: 'client_id',
                foreignField: '_id',
                as: 'client_info',
            },
        },
        { $unwind: '$client_info' },
    ]);
    const projects = Projects.aggregatePaginate(myAggregate, { ...filters }, { limit, page, lean: true });
    return await projects;
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 01-09-2022
 * Desc: To get single project information
 * Function: getSingleProject
 * Api: /projects/:id
 */

const getSingleProject = async (req, id, res) => {
    try {
        const condition = { _id: ObjectId(id) }; //, type: 'premium-job'
        // if (res.tokenData.user_role === 'tp_associate') {
        //     condition['talent_manager_associate.talent_associate_id'] = ObjectId(res.tokenData.user_id);
        // } //
        const getDetailProject = await Projects.aggregate([
            {
                $match: condition,
            },
        ]);
        const selectedResp = await request.get({}, 'jobs-interaction-service', `/job-interaction/get-user-count-status-wise?status=hired&projecId=${id}`, {});
        let selectedCount = 0;
        if (selectedResp && selectedResp.data && selectedResp.data.data && selectedResp.data.data.count) {
            // eslint-disable-next-line no-unused-vars
            selectedCount = parseInt(selectedResp.data.data.count, 10);
        }
        if (getDetailProject && getDetailProject.length > 0) {
            getDetailProject[0].no_requirements_fullfilled = selectedCount;
            // -------------- Display jobs count in list start------------------//
            const jobs2 = await Projects.aggregate([
                { $match: condition },
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

                for (let i = 0; i < getDetailProject.length; i += 1) {
                    for (let j = 0; j < developerInterestCount.data.data.jobHeaderCount.length; j += 1) {
                        if (getDetailProject[i]._id.toString() === developerInterestCount.data.data.jobHeaderCount[j].project_id) {
                            getDetailProject[i].job_counts = {
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

            return globalCalls.checkResponse(200, getDetailProject, 'Job detail found successfully');
        } else {
            return globalCalls.badRequestError('Error, while finding the project');
        }
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

/*
 * Created By: Shubhankar Kesharwani
 * Created Date: 01-03-2023
 * Desc: To get single project and client information
 * Function: getSingleProjectClientDetail
 * Api: /projects/get-single-client/:id
 */

const getSingleProjectClientDetail = async (id) => {
    try {
        const getDetailProject = await Projects.aggregate([
            {
                $match: { _id: ObjectId(id), type: 'premium-job' },
            },
            {
                $project: {
                    _id: 0,
                    client_id: 1,
                    client_name: 1,
                },
            },
        ]);

        return globalCalls.checkResponse(200, getDetailProject, 'Client project find successfully');
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

// const projectUpdate = async (projectId, body, auth) => {
const getATSJobDetails = async (id, res) => {
    try {
        // console.log('body', body);
        // console.log('auth', auth.res);
        const getDetailProject = await Projects.aggregate([
            {
                $match: { _id: ObjectId(id) },
            },
        ]);
        if (getDetailProject) {
            // get organization details start
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = `/engineers/get-organization-details-axios/${base64encode(String(getDetailProject[0].ats_tenant_id))}`;
            // const path = '/engineers/get-organization-details-axios/NjNmMzRiZDZlYTJmYThjNTI0MmY1NTNk';
            const response = await request.get(ctx, service, path, requestConfig);

            // console.log(response);
            if (response) {
                getDetailProject[0].organizationData = response.data ? response.data.data : [];
            } else {
                getDetailProject[0].organizationData = [];
            }
            // console.log(organizationData);
            // get organization details end

            return globalCalls.checkResponse(200, getDetailProject, 'Project details get successfully');
        } else {
            return globalCalls.badRequestError('Error, while finding the project');
        }
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Zubear Ansari
 * Created Date: 22-02-2023
 * Desc: career-page-job-detail
 * Function: projectUpdate
 * Api: /projects/career-page-job-detail/:tenant_id/:job_id
 */
const getCareerJobDetails = async (ats_admin_id, job_id) => {
    try {
        const getDetailProject = await Projects.aggregate([
            {
                $match: {
                    _id: ObjectId(job_id),
                    ats_admin_id: ObjectId(ats_admin_id),
                    type: { $in: ['ats-fulltime', 'ats-internship', 'ats-contract'] },
                    // project_status: 'posted',
                    project_status: { $in: ['posted', 'paused', 'closed'] },
                },
            },
        ]);
        if (getDetailProject.length > 0) {
            if (getDetailProject[0].project_status === 'closed') {
                return globalCalls.badRequestError('Sorry, The Recruiter has closed this job.');
            }
            // get organization details start
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = `/engineers/get-organization-details-master-axios/${base64encode(String(ats_admin_id))}`;
            const response = await request.get(ctx, service, path, requestConfig);

            // console.log(response);
            if (response) {
                getDetailProject[0].organizationData = response.data ? response.data.data : [];
            } else {
                getDetailProject[0].organizationData = [];
            }
            // console.log(organizationData);
            // get organization details end//

            // get job setting start
            const jobSettingsCount = await JobSettings.find({ ats_admin_id }).countDocuments();
            const jobSettingData = await JobSettings.findOne({ ats_admin_id });
            // get job setting end

            const responseData = {
                jobDetail: getDetailProject[0],
                jobSettingData,
                jobSettingsAdded: (jobSettingsCount > 0),
            };

            return globalCalls.checkResponse(200, responseData, 'Project details get successfully');
        } else {
            return globalCalls.badRequestError('Sorry, No project found due to invalid-id');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};
const getCareerJobDetails_ByTenentId = async (tenant_id, job_id) => {
    try {
        const getDetailProject = await Projects.aggregate([
            {
                $match: {
                    _id: ObjectId(job_id),
                    ats_tenant_id: ObjectId(tenant_id),
                    type: { $in: ['ats-fulltime', 'ats-internship', 'ats-contract'] },
                    // project_status: 'posted',
                    project_status: { $in: ['posted', 'paused', 'closed'] },
                },
            },
        ]);
        if (getDetailProject.length > 0) {
            if (getDetailProject[0].project_status === 'closed') {
                return globalCalls.badRequestError('Sorry, The Recruiter has closed this job.');
            }
            // get organization details start
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = `/engineers/get-organization-details-axios/${base64encode(String(tenant_id))}`;
            const response = await request.get(ctx, service, path, requestConfig);

            // console.log(response);
            if (response) {
                getDetailProject[0].organizationData = response.data ? response.data.data : [];
            } else {
                getDetailProject[0].organizationData = [];
            }
            // console.log(organizationData);
            // get organization details end

            // get job setting start
            const jobSettingsCount = await JobSettings.find({ ats_tenant_id: tenant_id }).countDocuments();
            const jobSettingData = await JobSettings.findOne({ ats_tenant_id: tenant_id });
            // get job setting end

            const responseData = {
                jobDetail: getDetailProject[0],
                jobSettingData,
                jobSettingsAdded: (jobSettingsCount > 0),
            };

            return globalCalls.checkResponse(200, responseData, 'Project details get successfully');
        } else {
            return globalCalls.badRequestError('Sorry, No project found due to invalid-id');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};
/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 01-09-2022
 * Desc: To update single project
 * Function: projectUpdate
 * Api: /projects/:id
 */

const projectUpdate = async (projectId, body, auth) => {
    try {
        const updateData = body;
        const validateAddJob = await addJobs.validate(updateData);
        if (validateAddJob && validateAddJob.error && validateAddJob.error.details[0]) return globalCalls.badRequestError(validateAddJob.error.details[0].message);

        delete updateData.no_of_rounds; delete updateData.interview_rounds;
        if (updateData.is_world_wide === true) {
            delete updateData.location;
            delete updateData.job_city;
            await Projects.updateOne({ _id: projectId }, {
                $unset: {
                    location: 1, job_city: 1, job_state: 1, job_country: 1,
                },
            });
        }

        // ********** Call to Job Management Service  ******** //

        await request.put(
            {},
            'jobs-interaction-service',
            `/job-interaction/axios-job-status-update/${projectId}`,
            {
                project_role: updateData.role[0].role,
                client_name: updateData.client_name,
                contract_type: updateData.engagement_type[0].data,
                job_primary_skills: updateData.primary_skills,
                job_experience: updateData.experience_range[0].data,
                // total_interview_rounds: updateData.no_of_rounds,
                project_requirements: updateData.no_requirements,
                project_duration: updateData.month_of_engagement[0].data,
            },
            { headers: { Authorization: auth } },
        );

        await request.post(
            {},
            'resource-management-orchestrator',
            '/orchestrator/update-resource-orchestrator-data',
            {
                condition: {
                    job_id: projectId,
                },
                record: {
                    time_zone_id: updateData.working_time_zone[0]._id,
                    time_zone: updateData.working_time_zone[0].label,
                },
            },
            { headers: { Authorization: auth } },
        );

        const updateProject = await Projects.findByIdAndUpdate(projectId, updateData);

        if (updateProject) {
            const checkWheatherDataChanged = await updateProject;
            if (updateData && updateData.working_time_zone && updateData.working_time_zone.length > 0 && updateData.working_time_zone[0] && updateData.working_time_zone[0]._id) {
                const objectId1 = ObjectId(checkWheatherDataChanged.working_time_zone[0]._id);
                const objectId2 = ObjectId(updateData.working_time_zone[0]._id);
                if (objectId1.toString() !== objectId2.toString()) {
                    console.log('ObjectIds are not equal');
                    // Bulk Check Out if location change..
                    await request.post(
                        {},
                        'resource-management-orchestrator',
                        '/orchestrator/bulk-user-check-out',
                        {
                            job_id: projectId,
                            out_time: new Date(),
                            check_out: new Date(),
                        },
                        { headers: { Authorization: auth } },
                    );
                }
            }
            return globalCalls.checkResponse(200, [], 'Client project updated successfully');
        } else {
            return globalCalls.badRequestError('Error, while updateing the project');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Piyush Bhangale
 * Created Date: 01-09-2022
 * Function Name: updateJobInteractionCount
 * API: /projects/update-interaction-count/:id (id is base 64 encoded )
 * Method: PUT
 * Description: Internal Service To update status counts from Job Interaction service
 * @param {*} data
 * @returns
 */

const updateJobInteractionCount = async (data, projectId) => {
    try {
        const increaseType = data.increase_type;
        const decreaseType = data.decrease_type;
        let updateCount = {};

        // const jobData = await Projects.findOne({ _id: ObjectId(projectId) }).select(decreaseType); //
        const jobData = await Projects.findOne({ _id: ObjectId(projectId) }).select('shortlisted_count interested_count interviewing_count hired_count rejected_count');

        let isValueMinusZero = false;
        if (decreaseType === 'shortlisted_count') {
            if (jobData.shortlisted_count <= 0) isValueMinusZero = true;
        } else if (decreaseType === 'interested_count') {
            if (jobData.interested_count <= 0) isValueMinusZero = true;
        } else if (decreaseType === 'interviewing_count') {
            if (jobData.interviewing_count <= 0) isValueMinusZero = true;
        } else if (decreaseType === 'hired_count') {
            if (jobData.hired_count <= 0) isValueMinusZero = true;
        } else if (decreaseType === 'rejected_count') {
            if (jobData.rejected_count <= 0) isValueMinusZero = true;
        }

        if (isValueMinusZero === true) {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1 } }, { returnOriginal: false });
        } else if (isValueMinusZero === false) {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1, [decreaseType]: -1 } }, { returnOriginal: false });
        } else {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1, [decreaseType]: -1 } }, { returnOriginal: false });
        }

        if (updateCount) {
            return globalCalls.checkResponse(200, updateCount, `${increaseType} & ${decreaseType}  updated successfully`);
        } else {
            return globalCalls.badRequestError(`Error, while updating ${increaseType} & ${decreaseType}`);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};
const updateJobInteractionCount_saved = async (data, projectId) => {
    try {
        const increaseType = data.increase_type;
        const decreaseType = data.decrease_type;
        let updateCount = {};

        // const jobData = await Projects.findOne({ _id: ObjectId(projectId) }).select(decreaseType);
        const jobData = await Projects.findOne({ _id: ObjectId(projectId) }).select('shortlisted_count interested_count interviewing_count hired_count rejected_count');

        let isValueMinusZero = false;
        if (decreaseType == 'shortlisted_count') {
            if (jobData.shortlisted_count <= 0) isValueMinusZero = true;
        } else if (decreaseType == 'interested_count') {
            if (jobData.interested_count <= 0) isValueMinusZero = true;
        } else if (decreaseType == 'interviewing_count') {
            if (jobData.interviewing_count <= 0) isValueMinusZero = true;
        } else if (decreaseType == 'hired_count') {
            if (jobData.hired_count <= 0) isValueMinusZero = true;
        } else if (decreaseType == 'rejected_count') {
            if (jobData.rejected_count <= 0) isValueMinusZero = true;
        }

        if (isValueMinusZero === true) {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1 } }, { returnOriginal: false });
        } else if (isValueMinusZero === false && isIncreaseTypeNull === false) {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1, [decreaseType]: -1 } }, { returnOriginal: false });
        } else if (isValueMinusZero === false && isIncreaseTypeNull === true) {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [decreaseType]: -1 } }, { returnOriginal: false });
        } else if (isValueMinusZero === true && isIncreaseTypeNull === true) {
            console.log('no change'); // updateCount = {}; //
        } else {
            updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1, [decreaseType]: -1 } }, { returnOriginal: false });
        }

        // updateCount = await Projects.findByIdAndUpdate({ _id: projectId }, { $inc: { [increaseType]: 1, [decreaseType]: -1 } }, { returnOriginal: false }); //
        if (updateCount) {
            return globalCalls.checkResponse(200, updateCount, `${increaseType} & ${decreaseType}  updated successfully`);
        } else {
            return globalCalls.badRequestError(`Error, while updating ${increaseType} & ${decreaseType}`);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};
/**
 * Created By: Shubham Kumar
 * Created Date: 01-09-2022
 * Function Name: job
 * API: projects/job/:id (id is base 64 encoded ) individual developer side detail
 * Method: GET
 * Description: To show a job in details
 */

const job = async (id) => {
    try {
        if (!id) {
            return { statusCode: 400, message: 'Please pass id' };
        }
        const projectData1 = await Projects.aggregate([
            {
                $match: { _id: ObjectId(id), type: 'premium-job' },
            },
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
                    role: 1,
                    experience_range: 1,
                    expectations: 1,
                    primary_skills: 1,
                    secondary_skills: 1,
                    tentative_start: 1,
                    system_provided: 1,
                    working_time_zone: 1,
                    working_hours: 1,
                    city_preference: 1,
                    job_responsibility: 1,
                    engagement_type: 1,
                    ss_price: 1,
                    month_of_engagement: 1,
                    no_requirements: 1,
                    no_of_rounds: 1,
                    interview_rounds: 1,
                    communication_skill: 1,
                    job_city: 1,
                    job_state: 1,
                    job_country: 1,
                    location: 1,
                    rand_no: 1,
                    is_world_wide: 1,
                    tools_used: 1,
                    project_id: 1,
                    job_status: 1,
                    is_client_deleted: 1,
                    travel_preference: 1,
                    type: 1,
                    'client_info._id': 1,
                    'client_info.name': 1,
                    'client_info.about_company': 1,
                    interested_count: { $sum: ['$interested_count', '$interviewing_count', '$hired_count', '$rejected_count', '$shortlisted_count'] },
                },
            },
        ]);

        const responseData = { projectData: projectData1[0] };
        return globalCalls.successData('Job detail found successfully', responseData);
    } catch (error) {
        return { statusCode: 400, message: 'Error occured', error: error.message };
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 01-09-2022
 * Function Name: jobListing
 * API: projects/list
 * Method: GET
 * Description: To show all job posts
 */

const jobListing = async (req, res) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);
        let filter = [];
        let msg = 'Job data found successfully';

        // ********** Call to Job Management Service  ******** //
        const { search } = req.query;
        const condition = {};

        // -------------- Filter start here------------------//
        if (search && search.length > 0) {
            condition['role.role'] = { $regex: `.*${search}.*`, $options: 'i' };
        }
        if (req.query.role_id) {
            condition.role = { $elemMatch: { _id: { $nin: ObjectId(req.query.role_id) } } };
            // condition['role._id'] = { $nin: ObjectId(req.query.role_id) };
        }
        const ctx = {};
        const requestConfig = {
            headers: { Authorization: req.headers.authorization },
        };
        const service = 'jobs-interaction-service';
        const path = `/job-interaction/get-projects-filter/${res.tokenData.user_id}`;
        const response = await request.get(ctx, service, path, requestConfig);

        filter = response.data ? response.data.data : [];

        condition._id = { $nin: filter };
        condition.type = 'premium-job';

        const projectData = await Projects.find(condition)
            .skip(offset)
            .limit(limit)
            .select('role experience_range expectations primary_skills ss_price  month_of_engagement createdAt updatedAt engagement_type project_id job_status travel_preference type location is_world_wide rand_no')
            .where('job_status')
            .eq(null)
            .sort({ updatedAt: -1, createdAt: -1, cron_date: -1 });
        const countProject = await Projects.find(condition).where('job_status').eq(null).countDocuments();
        const responseData = { projectData, total: countProject };
        if (parseInt(countProject, 10) === 0) { msg = 'No search data found'; }
        return globalCalls.successData(msg, responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Zubear Ansari
 * Created Date: 13-02-2023
 * Function Name: atsJobList
 * API: projects/ats-jobs-list
 * Method: GET
 * Description: To show all job posts
 */
const atsJobList = async (req, res) => {
    try {
        // let tenant_id = base64decode(req.params.id);
        // console.log(res.tokenData);
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);

        const condition = {};
        condition.type = { $in: ['ats-fulltime', 'ats-internship', 'ats-contract'] };
        // condition.platform_type: 'super-hire'
        // if (res.tokenData.user_id) condition.ats_user_id = res.tokenData.user_id;
        // if (res.tokenData.ats_admin_id) condition.ats_admin_id = res.tokenData.ats_admin_id;

        // get data based on user roles start
        const roleDataTime = new Date();
        if (res.tokenData.user_role === 'ats_superadmin' || res.tokenData.user_role === 'ats_super_admin' || res.tokenData.user_role === 'ats_admin' || res.tokenData.user_role === 'admin') {
            if (res.tokenData.ats_admin_id) {
                condition.ats_admin_id = ObjectId(res.tokenData.ats_admin_id);
            } else {
                condition.ats_admin_id = ObjectId(res.tokenData.user_id);
            }
        } else if (res.tokenData.user_role === 'ats_team_member') {
            const teamIds = [];
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = '/engineers/get-teammember-id-axios/'+base64encode(String(res.tokenData.user_id));
            // const path = '/engineers/get-teammember-id-axios/NjQxMDNmOTU4ZDY5NjQzMmUzMGM4OGYx';
            const response = await request.get(ctx, service, path, requestConfig);
            const teamRes = response.data ? response.data.data : [];
            if (teamRes) {
                if (teamRes.teamIds) {
                    if (teamRes.teamIds.length > 0) {
                        for (let iu = 0; iu < teamRes.teamIds.length; iu++) {
                            teamIds.push(ObjectId(teamRes.teamIds[iu]._id));
                        }
                    }
                }
            }
            teamIds.push(ObjectId(res.tokenData.user_id));
            // condition.ats_user_id = { $in: teamIds };
            condition.$or = [
                { ats_user_id: { $in: teamIds } },
                { 'contact_person._id': { $in: teamIds } },
                { 'hiring_manager._id': { $in: teamIds } },
            ];
        } else if (res.tokenData.user_role === 'ats_restricted_team_member') {
            // condition.ats_user_id = ObjectId(res.tokenData.user_id);
            condition.$or = [
                { ats_user_id: ObjectId(res.tokenData.user_id) },
                { 'contact_person._id': ObjectId(res.tokenData.user_id) },
                { 'hiring_manager._id': ObjectId(res.tokenData.user_id) },
            ];
        }
        const afterRoleDataFetchedTime = new Date();
        const diffAfterRolesData = afterRoleDataFetchedTime - roleDataTime;
        console.log(`differenec in time diffAfterRolesData ${diffAfterRolesData} ms`);

        // condition['hiring_manager._id'] = { $in: [ObjectId('6411a8e337cfc3f6c248fb14'), ObjectId('6411a9ce37cfc3f6c248fb4e')] };
        // condition.$or = [
        //     { ats_admin_id: new ObjectId('6417f4314c00142d46889034') },
        //     // { 'hiring_manager._id': { $in: [ObjectId('6411a8e337cfc3f6c248fb14'), ObjectId('6411a9ce37cfc3f6c248fb4e'), ObjectId('63c7eb4938038c0c39c09620')] } },
        //     { 'contact_person._id': ObjectId('6411a9ce37cfc3f6c248fb4e') },
        //     { 'hiring_manager._id': ObjectId('6411a9ce37cfc3f6c248fb4e') },
        // ];
        // condition['hiring_manager._id'] = ObjectId('6411a9ce37cfc3f6c248fb4e');
        // get data based on user roles end

        /* if (res.tokenData.tenant_id) condition.ats_tenant_id = ObjectId(res.tokenData.tenant_id);
        else {
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = '/engineers/get-tenant-id-axios-session-update/'+base64encode(String(res.tokenData.user_id));
            // const path = '/engineers/get-tenant-id-axios-session-update/NjQwZWJmMDU1MjZkOWJlZGVlZWY3ZDdh';
            const response = await request.get(ctx, service, path, requestConfig);
            const tenantData = response.data ? response.data.data : [];
            if (tenantData) {
                if (tenantData.userInfo && tenantData.userInfo.ats_tenant_id) {
                    condition.ats_tenant_id = ObjectId(tenantData.userInfo.ats_tenant_id);
                } // else return globalCalls.badRequestError('Please add organization details before posting job.');
            } // else return globalCalls.badRequestError('Please add organization details before posting job.');
        } */

        if (req.query && req.query.search) {
            const { search } = req.query;
            condition.$or = [
                { job_title: { $regex: `.*${search}.*`, $options: 'i' } },
                { project_id: { $regex: `.*${search.trim()}.*`, $options: 'i' } },
                { type: { $regex: `.*${search}.*`, $options: 'i' } },
            ];
        }
        if (req.query && req.query.status) {
            condition.project_status = req.query.status;
        } else {
            condition.project_status = { $ne: 'draft' };
        }

        // const projectData = await Projects.find(condition) // { _id: ObjectId(projectId) }
        //     .skip(offset)
        //     .limit(limit)
        //     // primary_skills ss_price
        // eslint-disable-next-line max-len
        //     .select('project_id job_title department role tentative_start experience_range expectations month_of_engagement createdAt updatedAt engagement_type project_id job_status travel_preference type month_of_engagement engagement_type experience_level min_exp_range max_exp_range client_name project_status type contact_person no_of_requirements interested_count shortlisted_count interviewing_count offer_sent_count offer_reject_count hired_count rejected_count comment_closed comment_pause hiring_manager reason_for_job_close reason_for_job_paused currency')
        //     .where('job_status')
        //     .eq(null)
        //     .sort({ updatedAt: -1, createdAt: -1 });

        const projectData = await Projects.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    job_title: 1,
                    department: 1,
                    role: 1,
                    tentative_start: 1,
                    experience_range: 1,
                    expectations: 1,
                    month_of_engagement: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    engagement_type: 1,
                    project_id: 1,
                    job_status: 1,
                    travel_preference: 1,
                    type: 1,
                    experience_level: 1,
                    min_exp_range: 1,
                    max_exp_range: 1,
                    client_name: 1,
                    project_status: 1,
                    contact_person: 1,
                    no_of_requirements: 1,
                    interested_count: 1,
                    shortlisted_count: 1,
                    interviewing_count: 1,
                    offer_sent_count: 1,
                    offer_reject_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    comment_closed: 1,
                    comment_pause: 1,
                    hiring_manager: 1,
                    reason_for_job_close: 1,
                    reason_for_job_paused: 1,
                    currency: 1,
                    interview_rounds_ats: 1,
                },
            },
        ]);
        const afterAggregateTime = new Date();
        const diffAfterAggregate = afterAggregateTime - afterRoleDataFetchedTime;
        console.log(`difference in time diffAfterAggregate ${diffAfterAggregate} ms`);
        const countProject = await Projects.find(condition).where('job_status').eq(null).countDocuments();

        const afterCountProjectTime = new Date();
        const diffAfterCount = afterCountProjectTime - afterAggregateTime;
        console.log(`difference in time diffAfterCount ${diffAfterCount} ms`);
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

        const afterProject2AggTime = new Date();
        const diffAfterProject2 = afterProject2AggTime - afterCountProjectTime;
        console.log(`difference in time diffAfterProject2 ${diffAfterProject2} ms`);
        let afterForLoopTime;

        if (jobs2.length > 0) {
            const jobIds = jobs2[0].jobIds.map((objId) => objId.toString());
            console.log(jobIds)

            const developerInterestCount = await request.post(
                {},
                'jobs-interaction-service',
                '/job-interaction/get-ats-candidate-jobwise-axios',
                {
                    project_id: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );
            const afterdeveloperInterestCountTime = new Date();
            const diffAfterdeveloperInterestCount = afterdeveloperInterestCountTime - afterProject2AggTime;
            console.log(`difference in time diffAfterdeveloperInterestCount ${diffAfterdeveloperInterestCount} ms`);
            // console.log(developerInterestCount)
            for (let i = 0; i < projectData.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.length; j += 1) {
                    if (projectData[i]._id.toString() === developerInterestCount.data.data[j].project_id) {
                        projectData[i].job_counts = {
                            applied: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].applied, 10) : 0,

                            shortListed: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].shortlisted, 10) : 0,

                            offer_sent: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].offer_sent, 10) : 0,

                            offer_accepted: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].offer_accepted, 10) : 0,

                            offer_rejected: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].offer_rejected, 10) : 0,

                            dropped: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].dropped, 10) : 0,

                            hired: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].hired, 10) : 0,

                            rejected: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].rejected, 10) : 0,

                            interviews: [
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].round1, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].round2, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].round3, 10) : 0,
                                },
                                {
                                    round: developerInterestCount.data && developerInterestCount.data.data ? parseInt(developerInterestCount.data.data[j].round4, 10) : 0,
                                },
                            ],
                        };
                    }
                }
                // projectData[i].job_counts = counts;
                // console.log(i, projectData[i].job_counts);
            }
            afterForLoopTime = new Date();
            const diffAfterForLoop = afterForLoopTime - afterdeveloperInterestCountTime;
            console.log(`difference in time diffAfterForLoop ${diffAfterForLoop} ms`);
        }

        const afterCountsAxiosTime = new Date();
        const diffAfterProjectCountAxios = afterCountsAxiosTime - afterForLoopTime;
        console.log(`difference in time diffAfterProjectCountAxios ${diffAfterProjectCountAxios} ms`);
        // -------------- Display jobs count in list ends------------------//
        const responseData = {
            total: countProject,
            projectData,
        };

        return globalCalls.successData('Job list found successfully', responseData);
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Zubear Ansari
 * Created Date: 13-02-2023
 * Function Name: careerPageJobList
 * API: projects/career-page-jobs
 * Method: GET
 * Description: To show all job posts
 */
const careerPageJobList = async (req) => {
    try {
        const ats_admin_id = base64decode(req.params.id);
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);
        // let filter = [];

        // ********** Call to Job Management Service  ******** //
        // const ctx = {};
        // const requestConfig = {
        //     headers: { Authorization: req.headers.authorization },
        // };
        // const service = 'jobs-interaction-service';
        // const path = `/job-interaction/get-projects-filter/${res.tokenData.user_id}`;
        // const response = await request.get(ctx, service, path, requestConfig);

        // filter = response.data ? response.data.data : [];

        // type: { $nin: ['ats-fulltime', 'ats-internship', 'ats-contract'] }
        // platform_type: ''

        const condition = {};
        condition.ats_admin_id = ats_admin_id;
        condition.project_status = { $in: ['posted', 'paused'] };
        condition.type = { $in: ['ats-fulltime', 'ats-internship', 'ats-contract'] };
        if (req.query && req.query.search) {
            const { search } = req.query;
            condition.$or = [{ job_title: { $regex: `.*${search.trim()}.*`, $options: 'i' } }, { project_id: { $regex: `.*${search.trim()}.*`, $options: 'i' } }, { type: { $regex: `.*${search.trim()}.*`, $options: 'i' } }];
            // { type: { $regex: `.*${search}.*`, $options: 'i' } },
        }

        // console.log(condition);
        const projectData = await Projects.find(condition) // { _id: ObjectId(projectId) }
            .skip(offset)
            .limit(limit)
            // primary_skills ss_price  department//
            .select('project_id job_title role tentative_start experience_range expectations month_of_engagement createdAt updatedAt engagement_type project_id ats_admin_id job_status travel_preference type month_of_engagement engagement_type hiring_manager')
            .where('job_status')
            .eq(null)
            .sort({ updatedAt: -1, createdAt: -1 });

        const countProject = await Projects.find(condition).where('job_status').eq(null).countDocuments();

        // get job setting start
        const jobSettingsCount = await JobSettings.find({ ats_admin_id: ats_admin_id }).countDocuments();
        const jobSettingData = await JobSettings.findOne({ ats_admin_id: ats_admin_id });
        // get job setting end

        const responseData = {
            projectData,
            total: countProject,
            jobSettingData,
            jobSettingsAdded: (jobSettingsCount > 0),
        };

        return globalCalls.successData('Job list found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const careerPageJobList_ByTenantId = async (req) => {
    try {
        const tenant_id = base64decode(req.params.id);
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);
        // let filter = [];

        // ********** Call to Job Management Service  ******** //
        // const ctx = {};
        // const requestConfig = {
        //     headers: { Authorization: req.headers.authorization },
        // };
        // const service = 'jobs-interaction-service';
        // const path = `/job-interaction/get-projects-filter/${res.tokenData.user_id}`;
        // const response = await request.get(ctx, service, path, requestConfig);

        // filter = response.data ? response.data.data : [];

        // type: { $nin: ['ats-fulltime', 'ats-internship', 'ats-contract'] }
        // platform_type: ''

        const condition = {};
        condition.ats_tenant_id = tenant_id;
        // condition.project_status = 'posted';
        condition.project_status = { $in: ['posted', 'paused'] };
        condition.type = { $in: ['ats-fulltime', 'ats-internship', 'ats-contract'] };
        if (req.query && req.query.search) {
            const { search } = req.query;
            condition.$or = [{ job_title: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim()}.*` } }, { type: { $regex: `.*${search.trim()}.*` } }];
        }

        const projectData = await Projects.find(condition) // { _id: ObjectId(projectId) }
            .skip(offset)
            .limit(limit)
            // primary_skills ss_price  department
            .select('project_id job_title role tentative_start experience_range expectations month_of_engagement createdAt updatedAt engagement_type project_id ats_admin_id job_status travel_preference type month_of_engagement engagement_type hiring_manager')
            .where('job_status')
            .eq(null)
            .sort({ updatedAt: -1, createdAt: -1 });

        const countProject = await Projects.find(condition).where('job_status').eq(null).countDocuments();

        // get job setting start
        const jobSettingsCount = await JobSettings.find({ ats_tenant_id: tenant_id }).countDocuments();
        const jobSettingData = await JobSettings.findOne({ ats_tenant_id: tenant_id });
        // get job setting end

        const responseData = {
            projectData,
            total: countProject,
            jobSettingData,
            jobSettingsAdded: (jobSettingsCount > 0),
        };

        return globalCalls.successData('Job list found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 12-02-2023
 * Function Name: jobOfferDetails
 * API: projects/offer-details (projectId is base 64 encoded )
 * Method: GET
 * Description: To show offer details individual developer side.
 */

const jobOfferDetails = async (projectId, status, res) => {
    try {
        const jobData = await Projects.findOne({ _id: ObjectId(projectId) }).select('travel_preference engagement_type project_id role primary_skills working_hours working_time_zone location ss_price client_name is_world_wide');
        if (!jobData) {
            return globalCalls.badRequestError('Job does not exist!');
        } else {
            const offerDetail = await request.get({}, 'jobs-interaction-service', `/job-interaction/axios-get-offered-details?project_id=${projectId}&engineer_id=${res.user_id}&status=${status}`, {});
            let responseData = {};
            if (offerDetail && offerDetail.data && offerDetail.data.data && offerDetail.data.data[0]) {
                const jobInteractionInfo = await offerDetail.data.data[0];
                const offerInfo = {
                    id: jobInteractionInfo.id,
                    contract_start_date: jobInteractionInfo.contract_start_date,
                    contract_end_date: jobInteractionInfo.contract_end_date,
                    account_manager_id: jobInteractionInfo.account_manager_id,
                    account_manager_name: jobInteractionInfo.account_manager_name,
                    final_price: jobInteractionInfo.final_price,
                };
                responseData = { jobData, offerInfo };
            }
            return globalCalls.successData('Offer details get successfully', responseData);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 01-13-2022
 * Function Name: jobDetailForAdmin
 * API: projects/job-detail
 * Method: GET
 * Description: To show single job in detail
 */

const jobDetailForAdmin = async (id) => {
    try {
        const jobs = await Projects.aggregate([
            { $match: { _id: ObjectId(id), type: 'premium-job' } },
            {
                $project: {
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
                    working_time_zone: 1,
                    working_hours: 1,
                    travel_preference: 1,
                    city_preference: 1,
                    tools_used: 1,
                    system_provided: 1,
                    no_of_rounds: 1,
                    job_responsibility: 1,
                    interview_rounds: 1,
                    communication_skill: 1,
                    createdAt: 1,
                    project_id: 1,
                    interested_count: 1,
                    interviewing_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    type: 1,
                },
            },
        ]);
        if (!jobs) {
            return globalCalls.badRequestError('Job not exist');
        }

        const responseData = {
            jobs,
        };
        return globalCalls.successData('Job detail found successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 01-13-2022
 * Function Name: jobListForAdmin
 * API: projects/job-list
 * Method: GET
 * Description: To show all job for admin panel
 */
const jobListForAdmin = async (req) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);
        const { search } = req.query;
        const filter = req.query;
        const condition = {};
        condition.type = 'premium-job';
        condition.job_status = { $nin: ['Win', 'Loss'] };
        if (req.query._id && req.query._id.length > 0) {
            condition._id = ObjectId(filter._id);
        }

        // -------------- Filter start ------------------//
        if (search && search.length > 0) {
            condition.$or = [{ client_name: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim().toUpperCase()}.*` } }];
        }

        if (filter.roles) {
            const roleArr = filter.roles.split(',');
            condition['role.role'] = ({ $in: roleArr });
        }

        // Filter checked
        if (filter.no_requirements && filter.no_requirements.length > 0) {
            if (typeof (filter.no_requirements) === 'string') {
                filter.no_requirements = parseInt(filter.no_requirements, 10);
            }
            condition.no_requirements = filter.no_requirements;
        }

        // Filter checked
        if (filter.experience_range_id && filter.experience_range_id.length > 0) {
            condition['experience_range._id'] = ObjectId(filter.experience_range_id);
        }

        // Filter checked
        if (filter.client_id && filter.client_id.length > 0) {
            condition.client_id = ObjectId(filter.client_id);
        }

        if (filter.techskills) {
            const techskillsArr = filter.techskills.split(',');
            condition['primary_skills.skill'] = ({ $in: techskillsArr });
        }

        // -------------- Filter start ------------------//
        const jobs = await Projects.aggregate([
            { $sort: { createdAt: -1, updatedAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
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
                },
            },
        ]);

        // -------------- Display interest count in list start------------------//
        const jobs2 = await Projects.aggregate([
            { $sort: { createdAt: -1, updatedAt: -1 } },
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
                '/job-interaction/getInterestShownForJobs',
                {
                    data: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );
            // console.log('  ==> ', developerInterestCount.data.data, 'developerInterestCount');

            for (let i = 0; i < jobs.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.length; j += 1) {
                    if (jobs[i]._id.toString() === developerInterestCount.data.data[j].project_id) {
                        jobs[i].interested_count = parseInt(developerInterestCount.data.data[j].count, 10);
                    }
                }
            }

        // -------------- Display interest count in list end------------------//
        }
        const total = await Projects.find(condition).countDocuments();
        let filterCount = await Projects.aggregate([
            { $match: condition },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0 } },
        ]);
        filterCount = filterCount.length === 0 ? 0 : filterCount[0].count;

        const requirementPostedCount = await Projects.aggregate([
            {
                $match: { job_status: { $nin: ['Win', 'Loss'] }, type: 'premium-job' },
            },
            {
                $group: {
                    _id: 0, requirements: { $sum: '$no_requirements' }, developer_placed: { $sum: '$hired_count' }, interview_scheduled: { $sum: '$interviewing_count' },
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
        const closedJobs = await Projects.find({ job_status: { $in: ['Win', 'Loss'] }, type: 'premium-job' }).countDocuments();

        const reqPostedCount = [{
            developer_placed: parseInt(developerPlaced, 10),
            // interview_scheduled: requirementPostedCount[0].interview_scheduled,
            // requirements: requirementPostedCount[0].requirements,
        }];
        if (requirementPostedCount && requirementPostedCount[0] && requirementPostedCount[0].interview_scheduled) {
            reqPostedCount[0].interview_scheduled = requirementPostedCount[0].interview_scheduled;
        } else {
            reqPostedCount[0].interview_scheduled = 0;
        }
        if (requirementPostedCount && requirementPostedCount[0] && requirementPostedCount[0].requirements) {
            reqPostedCount[0].requirements = requirementPostedCount[0].requirements;
        } else {
            reqPostedCount[0].requirements = 0;
        }
        const responseData = {
            filter_count: filterCount,
            jobs,
            total,
            header_count: { open_jobs: total, closed_jobs: closedJobs },
            requirementPostedCount: reqPostedCount,
            // requirementPostedCount: [{
            //     developer_placed: parseInt(developerPlaced, 10),
            //     interview_scheduled: requirementPostedCount[0].interview_scheduled,
            //     requirements: requirementPostedCount[0].requirements,
            // }],
        };
        return globalCalls.checkResponse(200, responseData, 'Jobs found successfully');
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 03-11-2022
 * Function Name: jobsProjectCount
 * API: projects/jobs-project-count
 * Method: Get
 * Description: Show count for project list admin side.
 */

const jobsProjectCount = async () => {
    try {
        const jobsCount = await Projects.aggregate([
            { $match: { type: 'premium-job' } },
            {
                $group: {
                    _id: 0, requirements: { $sum: '$no_requirements' }, developer_placed: { $sum: '$hired_count' }, interview_scheduled: { $sum: '$interviewing_count' },
                },
            },
        ]);
        const responseData = {
            jobsCount,
        };
        return globalCalls.successData('Jobs developer count get successfully', responseData);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 03-11-2022
 * Function Name: jobsWinLoss
 * API: projects/job-status
 * Method: Put
 * Description: To change status of job win and loss.
 */
const jobsWinLoss = async (jobId, data) => {
    try {
        const validateJobStatus = await jobStatusValidation.validate(data);
        if (validateJobStatus && validateJobStatus.error && validateJobStatus.error.details[0]) return globalCalls.badRequestError(validateJobStatus.error.details[0].message);
        const checkProjectExist = await Projects.findOne({ _id: jobId });
        if (checkProjectExist) {
            // eslint-disable-next-line no-param-reassign
            data.job_status_date = new Date();
            const responseData = await Projects.findByIdAndUpdate(jobId, data, { new: true });

            const ctx = {};
            const requestConfig = {};
            const service = 'jobs-interaction-service';
            const path = `/job-interaction/axios-job-status-update/${jobId}`;
            const interactionUpdateData = { job_status: data.job_status };
            await request.put(ctx, service, path, interactionUpdateData, requestConfig);

            return globalCalls.checkResponse(200, responseData, 'Job Status updated successfully');
        } else {
            return globalCalls.badRequestError('Error, this project does not exits!');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 03-11-2022
 * Function Name: WinAndLossJobList
 * API: projects/win-loss-job-list
 * Method: Put
 * Description: To change status of job win and loss.
 */

const WinAndLossJobList = async (req) => {
    try {
        const perPage = 10;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : perPage;
        let offset = req.query.offset ? req.query.offset : limit * (page - 1);
        offset = parseInt(offset, 10);

        const { search } = req.query;
        // const filter = req.query;
        const condition = {};
        condition.type = 'premium-job';
        condition.job_status = { $in: ['Win', 'Loss'] };

        // -------------- Filter start here------------------//
        if (search && search.length > 0) {
            condition.$or = [{ client_name: { $regex: `.*${search.trim()}.*` } }, { project_id: { $regex: `.*${search.trim().toUpperCase()}.*` } }];
        }
        // -------------- Filter end here ------------------//

        const jobs = await Projects.aggregate([
            { $sort: { createdAt: -1 } },
            { $match: condition },
            { $skip: offset },
            { $limit: limit },
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
                },
            },
        ]);

        // -------------- Display interest count in list start------------------//
        const jobs2 = await Projects.aggregate([
            { $sort: { createdAt: -1 } },
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
            console.log('jobIds =', jobIds);
            const developerInterestCount = await request.post(
                {},
                'jobs-interaction-service',
                '/job-interaction/getInterestShownForJobs',
                {
                    data: jobIds,
                },
                { headers: { Authorization: req.headers.authorization } },
            );
            // console.log('  ==> ', developerInterestCount.data.data, 'developerInterestCount');

            for (let i = 0; i < jobs.length; i += 1) {
                for (let j = 0; j < developerInterestCount.data.data.length; j += 1) {
                    if (jobs[i]._id.toString() === developerInterestCount.data.data[j].project_id) {
                        jobs[i].interested_count = parseInt(developerInterestCount.data.data[j].count, 10);
                    }
                }
            }

        // -------------- Display interest count in list end------------------//
        }
        const total = await Projects.find(condition).countDocuments();
        let filterCount = await Projects.aggregate([
            { $match: condition },
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0 } },
        ]);
        filterCount = filterCount.length === 0 ? 0 : filterCount[0].count;

        const openJobs = await Projects.find({ job_status: { $nin: ['Win', 'Loss'] }, type: 'premium-job' }).countDocuments();

        const requirementPostedCount = await Projects.aggregate([
            {
                $match: { job_status: { $in: ['Win', 'Loss'] }, type: 'premium-job' },
            },
            {
                $group: {
                    _id: 0, developerPlaced: { $sum: '$hired_count' }, totalRequirement: { $sum: '$no_requirements' },
                },
            },
        ]);

        const responseData = {
            filter_count: filterCount,
            jobs,
            total,
            header_count: { open_jobs: openJobs, closed_jobs: total },
            requirementPostedCount,
        };
        return globalCalls.checkResponse(200, responseData, 'Jobs found successfully');
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 03-11-2022
 * Function Name: updateIsWorldWideForExistingRecord
 * API: projects/job-status
 * Method: Put
 * Description: To update all existing record with ket is_world_wide: false
 */

const updateIsWorldWideForExistingRecord = async () => {
    try {
        const checkProjectExist = await Projects.updateMany({ is_world_wide: false });
        if (checkProjectExist) {
            return globalCalls.checkResponse(200, [], 'Job Status updated successfully');
        } else {
            return globalCalls.badRequestError('Error, this project does not exits!');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubham Kumar
 * Created Date: 12-01-2023
 * Function Name: closedJobAvg
 * API: projects/closed-job-avg
 * Method: GET
 * Description: To get avg time  for jobs to closed *(Used in job interaction through axios function: closed-job-success-rate-count)
 */
const closedJobAvg = async (req) => {
    try {
        const monthNo = parseInt(req.params.month, 10);
        const yearNo = parseInt(req.params.year, 10);

        let averageTimeToFillTillDate = await Projects.aggregate([
            {
                $match: {
                    job_status: { $in: ['Win', 'Loss'] },
                    type: 'premium-job',
                },
            },
            {
                $project: {
                    difference: { $round: { $add: [{ $divide: [{ $subtract: ['$job_status_date', '$createdAt'] }, 86400000] }, 1] } },
                    createdAt: 1,
                    job_status_date: 1,
                    job_status: 1,
                    type: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    averageDifference: { $avg: '$difference' },
                },
            },
        ]);

        if (averageTimeToFillTillDate && averageTimeToFillTillDate[0]) {
            averageTimeToFillTillDate = averageTimeToFillTillDate[0].averageDifference;
        } else { averageTimeToFillTillDate = 0; }

        let averageTimeToFillForThisMonth = await Projects.aggregate([
            {
                $match: {
                    job_status: { $in: ['Win', 'Loss'] },
                    type: 'premium-job',
                    $expr: {
                        $and: [
                            { $eq: [{ $month: '$job_status_date' }, monthNo] },
                            { $eq: [{ $year: '$job_status_date' }, yearNo] },
                        ],
                    },
                },
            },
            {
                $project: {
                    difference: { $round: { $add: [{ $divide: [{ $subtract: ['$job_status_date', '$createdAt'] }, 86400000] }, 1] } },
                    createdAt: 1,
                    job_status_date: 1,
                    job_status: 1,
                    type: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    averageDifference: { $avg: '$difference' },
                },
            },
        ]);

        if (averageTimeToFillForThisMonth && averageTimeToFillForThisMonth[0]) {
            averageTimeToFillForThisMonth = averageTimeToFillForThisMonth[0].averageDifference;
        } else { averageTimeToFillForThisMonth = 0; }

        const responseData = {
            average_time_to_fill_till_date: averageTimeToFillTillDate,
            average_time_to_fill_for_this_month: averageTimeToFillForThisMonth,
        };
        return globalCalls.checkResponse(200, responseData, 'success');
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 08-02-2023
 * Function Name: apiForOneTime
 * API: projects/closed-job-avg
 * Method: POST
 * Description: To remove unwanted key form databse records of projects.
 */
const apiForOneTime = async (data) => {
    try {
        const responseData = await Projects.updateMany(
            data.condition,
            data.recordUpdate,
        );
        return globalCalls.checkResponse(200, responseData, 'success');
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};
/** ************************************************WARNING******************************************* */

/** **************************************Only to be used once *************************************** */

const addTypeKeyforJob = async () => {
    try {
        const findUser = await Projects.find();
        for (let i = 0; i < findUser.length; i += 1) {
            await Projects.findOneAndUpdate({ _id: findUser[i]._id }, { type: 'premium-job' });
        }
        return globalCalls.successData('Job type key updated successfully', findUser);
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

const addJobSettings = async (data, res) => {
    try {
        let saveData = {};
        saveData = data;
        if (res.tokenData.user_id) saveData.ats_user_id = res.tokenData.user_id;
        if (res.tokenData.ats_admin_id) saveData.ats_admin_id = res.tokenData.ats_admin_id;
        else saveData.ats_admin_id = res.tokenData.user_id;
        if (res.tokenData.tenant_id) saveData.ats_tenant_id = res.tokenData.tenant_id;
        else return globalCalls.badRequestError('Please save company information first!');

        // check job setting already saved validation start
        const condition = {};
        // condition.ats_tenant_id = res.tokenData.tenant_id;
        if (res.tokenData.ats_admin_id) condition.ats_admin_id = res.tokenData.ats_admin_id;
        else condition.ats_user_id = res.tokenData.user_id;

        const JobSettingsCount = await JobSettings.find(condition).countDocuments();
        if (JobSettingsCount > 0) {
            return globalCalls.badRequestError('Job setting already added please use edit option!');
        }
        // check job setting already saved validation end

        const validateJobSettings = await jobSettingsValidate.validate(saveData);
        if (validateJobSettings && validateJobSettings.error && validateJobSettings.error.details[0]) return globalCalls.badRequestError(validateJobSettings.error.details[0].message);

        const saveJobSetting = await JobSettings(saveData).save();
        if (!saveJobSetting) {
            return globalCalls.badRequestError('Something went wrong, while saving the Job setting');
        } else {
            return globalCalls.successData('Job setting saved successfully', saveJobSetting);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const getJobSettings = async (data, res) => {
    try {
        let ats_admin_id;
        let saveData = {};
        const condition = {};
        // condition.ats_tenant_id = res.tokenData.tenant_id;
        if (res.tokenData.ats_admin_id) condition.ats_admin_id = res.tokenData.ats_admin_id;
        else condition.ats_user_id = res.tokenData.user_id;

        saveData = data;
        if (res.tokenData.user_id) saveData.ats_user_id = res.tokenData.user_id;
        if (res.tokenData.ats_admin_id) {
            saveData.ats_admin_id = res.tokenData.ats_admin_id;
            ats_admin_id = res.tokenData.ats_admin_id;
            // condition.ats_admin_id = res.tokenData.ats_admin_id;
        } else {
            saveData.ats_admin_id = res.tokenData.user_id;
            ats_admin_id = res.tokenData.user_id;
            // condition.ats_admin_id = res.tokenData.user_id;
        }
        if (res.tokenData.tenant_id) saveData.ats_tenant_id = res.tokenData.tenant_id;
        else return globalCalls.badRequestError('Please save company information first!');

        // check job setting already saved validation start
        // condition.ats_tenant_id = res.tokenData.tenant_id;

        const jobSettingsCount = await JobSettings.find(condition).countDocuments();
        // check job setting already saved validation end

        console.log(condition);
        const jobSettingData = await JobSettings.findOne(condition);
        const responseData = {
            jobSettingData,
            jobSettingsAdded: (jobSettingsCount > 0),
            iFrameUrl: `${globalConst.atsUrl}jobs-iframe/${base64encode(String(ats_admin_id))}`,
            iFrameId: base64encode(String(ats_admin_id)),
        };

        return globalCalls.successData('Job setting get successfully', responseData);
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Zubear Ansari
 * Created Date: 20-02-2023
 * Function Name: apiForOneTime
 * API: projects/update-job-settings
 * Method: PUT
 * Description: Update job setting date.//
 */
const updateJobSettings = async (data, res) => {
    try {
        let saveData = {};
        saveData = data;
        // console.log(res.tokenData.ats_admin_id, res.tokenData.user_id);

        // check job setting already saved validation start
        const condition = {};
        if (data._id) {
            condition._id = data._id;
        } else {
            // condition.ats_tenant_id = res.tokenData.tenant_id;
            if (res.tokenData.ats_admin_id) condition.ats_admin_id = res.tokenData.ats_admin_id;
            else condition.ats_admin_id = res.tokenData.user_id;
            condition.ats_user_id = res.tokenData.user_id;
        }

        const JobSettingsCount = await JobSettings.find(condition).countDocuments();
        if (JobSettingsCount === 0) {
            return globalCalls.badRequestError('Please add Job setting first!');
        }
        // check job setting already saved validation end

        // const saveJobSetting = await JobSettings(saveData).save();//
        const isSaved = await JobSettings.findOneAndUpdate(condition, saveData);
        if (!isSaved) {
            return globalCalls.badRequestError('Something went wrong, while saving the Job setting');
        } else {
            const saveJobSetting = await JobSettings.findOne(condition);
            return globalCalls.successData('Job setting saved successfully', saveJobSetting);
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 17-02-2023
 * Function Name: apiForOneTime
 * API: projects/apiForOneTimeForJobStatusDate
 * Method: GET
 * Description: Update job status date.
 */
const apiForOneTimeForJobStatusDate = async () => {
    try {
        const jobData = await Projects.find().select('updatedAt');
        if (jobData.length > 0) {
            for (let i = 0; i < jobData.length; i += 1) {
                await Projects.findOneAndUpdate({ _id: jobData[i]._id, job_status: 'Win', job_status_date: { $exists: false } }, { job_status_date: jobData[i].updatedAt });
                // const updateKey = await Projects.findOneAndUpdate({ _id: jobData[i]._id }, { $unset: {
                //     job_status_date: 1,
                // }});
            }
        }
        return globalCalls.checkResponse(200, jobData, 'success');
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Zubear Ansari
 * Created Date: 07-03-2023
 * Desc: To soft delete ats project
 * Function: deleteAtsJobs
 * Api: delete-ats-jobs
 * incomplete not in used
 */
const deleteAtsJobs = async (id, res) => {
    try {
        const userInfo = await Projects.findById(id);
        if (!userInfo) {
            return globalCalls.badRequestError('User not exist');
        }
        const allowToDelete = true;
        // const statusAllowded = ['Draft', 'profile-completed', 'completed-work-survey', 'completed-intro-video', 'skill-test-link-shared'];
        // let allowToDelete = false;
        // for (let i = 0; i < statusAllowded.length; i++) {
        //     if (statusAllowded[i] === userInfo.status) {
        //         allowToDelete = true;
        //         break;
        //     }
        // }
        if (allowToDelete === false) {
            return globalCalls.badRequestError('Not allowded to delete');
        } else {
            const userDeleted = await Projects.updateOne({ _id: id }, { $set: { isDelete: true, deleted_by_id: ObjectId(res.tokenData.user_id) } }); // deleted_by_id is admin id for now
            if (!userDeleted) {
                return globalCalls.badRequestError('Error in removed user');
            } else {
                return globalCalls.successData('User removed successfully', '');
            }
        }
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

const moveATSJobStatusWise = async (jobId, data, status, res) => {
    try {
        let updateData = {};
        const getJob = await Projects.findOne({
            _id: ObjectId(jobId), platform_type: 'super-hire', ats_user_id: ObjectId(res.tokenData.user_id), ats_tenant_id: ObjectId(res.tokenData.tenant_id),
        });
        if (!getJob) {
            return globalCalls.badRequestError('ATS Job not found');
        } else {
            if (status === 'closed') {
                updateData = {
                    project_status: 'closed',
                    comment_closed: data.comment,
                    reason_for_job_close: data.reason_for_job_close,
                };
            } else if (status === 'paused') {
                updateData = {
                    project_status: 'paused',
                    comment_pause: data.comment,
                    reason_for_job_paused: data.reason_for_job_paused,
                };
            } else {
                return globalCalls.badRequestError('Please provide any job status from closed or paused to move job');
            }
            const updateJobStatus = await Projects.updateOne(
                {
                    _id: ObjectId(jobId), platform_type: 'super-hire', ats_user_id: res.tokenData.user_id, ats_tenant_id: res.tokenData.tenant_id,
                },
                { $set: updateData },
            );
            if (!updateJobStatus) {
                return globalCalls.badRequestError('Error, while updating the job status');
            } else {
                return globalCalls.successData(`ATS job moved to ${status}`, updateJobStatus);
            }
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 10-03-2023
 * Function Name: apiForOneTime
 * API: projects/closed-job-avg
 * Method: POST
 * Description: To remove unwanted key form databse records of projects.
 */

const cronCode = async () => {
    try {
        const yesterday = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2));
        const fiveDaysAgo = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 5));
        console.log(' yesterday =', yesterday);
        console.log(' fiveDaysAgo = ', fiveDaysAgo);
        const responseData = await Projects.updateMany(
            { updatedAt: { $lte: fiveDaysAgo }, type: 'premium-job' }, // _id: ObjectId('63e38ea42c25165259024676')
            { $set: { cron_date: new Date(yesterday) } },
        );
        return globalCalls.checkResponse(200, responseData, 'success');
    } catch (error) {
        console.log(error.stack);
    }
};
const moveATSJobToOpenFromPaused = async (data) => {
    try {
        const getJob = await Projects.findOne({ _id: ObjectId(data.job_id), project_status: 'paused' });
        if (!getJob) {
            return globalCalls.badRequestError('ATS Job not found');
        } else {
            const updateJobStatus = await Projects.updateOne({ _id: ObjectId(data.job_id), project_status: 'paused' }, { $set: { project_status: 'posted' } });
            if (!updateJobStatus) {
                return globalCalls.badRequestError('Error, while moving ats job from paused to open');
            } else {
                return globalCalls.successData('ATS job moved to open', updateJobStatus);
            }
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/* Created By: Shubhankar Kesharwani
 * Created Date: 16-03-2023
 * Desc: New Feature, to dhow 3 jobs only of user role.
 * Function: getJobAccordingToUserRole
 * API: job-interaction/jobs-according-to-role/:userRole
 *  Method: GET
 */

const getJobAccordingToUserRole = async (roleId, req, res) => {
    try {
        // const requestConfig = {
        //     headers: { Authorization: req.headers.authorization },
        // };
        // const service = 'jobs-interaction-service';
        // const path = `/job-interaction/get-projects-filter/${res.tokenData.user_id}`;
        // const response = await request.get({}, service, path, requestConfig);

        // const filter = response && response.data && response.data.data ? response.data.data : [];

        const query = {};
        // query._id = { $nin: filter };
        query.role = { $elemMatch: { _id: ObjectId(roleId) } };
        query.type = 'premium-job';
        query.job_status = null;
        let getJob = await Projects.aggregate([
            { $sort: { createdAt: -1, updatedAt: -1 } },
            { $match: query },
            { $limit: 3 },
            {
                $project: {
                    role: 1,
                    type: 1,
                    experience_range: 1,
                    expectations: 1,
                    primary_skills: 1,
                    ss_price: 1,
                    month_of_engagement: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    engagement_type: 1,
                    project_id: 1,
                    job_status: 1,
                    travel_preference: 1,
                    interview_rounds: 1,
                    no_requirements: 1,
                    no_of_rounds: 1,
                    rand_no: 1,
                    location: 1,
                    is_world_wide: 1,
                },
            },
        ]);

        if (getJob.length === 0) {
            // getJob = await Projects.aggregate([
            //     { $sort: { createdAt: -1, updatedAt: -1 } },
            //     {
            //         $match: {
            //             // _id: { $nin: filter },
            //             job_status: null,
            //             type: 'premium-job',
            //             role: {
            //                 $elemMatch: { role: { $in: ['Data Engineer', 'Data Analyst', 'Frontend Engineer'] } },
            //             },
            //         },
            //     },
            //     {
            //         $group: {
            //             _id: '$role.role',
            //             type: { $first: '$type' },
            //             role: { $first: '$role' },
            //             experience_range: { $first: '$experience_range' },
            //             expectations: { $first: '$expectations' },
            //             primary_skills: { $first: '$primary_skills' },
            //             ss_price: { $first: '$ss_price' },
            //             month_of_engagement: { $first: '$month_of_engagement' },
            //             createdAt: { $first: '$createdAt' },
            //             updatedAt: { $first: '$updatedAt' },
            //             engagement_type: { $first: '$engagement_type' },
            //             project_id: { $first: '$project_id' },
            //             job_status: { $first: '$job_status' },
            //             travel_preference: { $first: '$travel_preference' },
            //         },
            //     },
            // ]);

            getJob = await Projects.aggregate([
                { $sort: { createdAt: -1, updatedAt: -1 } },
                {
                    $match: {
                        job_status: null,
                        type: 'premium-job',
                    },
                },
                { $limit: 3 },
                {
                    $project: {
                        role: 1,
                        type: 1,
                        experience_range: 1,
                        expectations: 1,
                        primary_skills: 1,
                        ss_price: 1,
                        month_of_engagement: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        engagement_type: 1,
                        project_id: 1,
                        job_status: 1,
                        travel_preference: 1,
                        interview_rounds: 1,
                        no_requirements: 1,
                        no_of_rounds: 1,
                        rand_no: 1,
                        location: 1,
                        is_world_wide: 1,
                    },
                },
            ]);
            console.log('user id= ', res.tokenData.user_id, ' Deafult jobs fetched successfully');
            return globalCalls.successData('Deafult jobs fetched successfully', getJob);
        } else {
            console.log('user id= ', res.tokenData.user_id, ' Jobs according to role fetched successfully');
            return globalCalls.successData('Jobs according to role fetched successfully', getJob);
        }
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 23-03-2023
 * Function Name: apiForOneTime
 * API: projects/create-rand-no
 * Method: POST
 * Description: To add rand no generate on job post api for display dummy show_interested cout user side.
 */

const apiForOneTimeRandNo = async () => {
    try {
        let responseData;
        const getAllData = await Projects.find().where({ type: 'premium-job' });
        console.log(getAllData.length);
        for (let i = 0; i < getAllData.length; i += 1) {
            const randomNumber = Math.floor(Math.random() * (100 - 50 + 1) + 50);
            console.log(' randomNumber = ', randomNumber, 'user name = ', getAllData[i]._id)
            responseData = await Projects.update(
                { type: 'premium-job', _id: ObjectId(getAllData[i]._id) }, // _id: ObjectId('63e38ea42c25165259024676')
                { $set: { rand_no: randomNumber } },
            );
        }
        return globalCalls.checkResponse(200, responseData, 'success');
    } catch (error) {
        console.log(error.stack);
    }
};

const getJobsForCandidate = async (data, search, limit = 10, offset = 0) => {
    try {
        const limitRes = parseInt(limit, 10);
        const offsetRes = parseInt(offset, 10);
        const condition = {};
        if (search) {
            condition.$or = [
                { job_title: { $regex: `.*${search}.*`, $options: 'i' } },
                { project_id: { $regex: `.*${search}.*`, $options: 'i' } },
            ];
        }
        if (data && data.jobsArr && data.jobsArr.length > 0) {
            data.jobsArr = data.jobsArr.map((objId) => ObjectId(objId));
        }
        condition._id = { $in: data.jobsArr };
        const getJobs = await Projects.aggregate([
            { $match: condition },
            { $sort: { createdAt: -1 } },
            { $limit: limitRes },
            { $skip: offsetRes },
        ]);

        return globalCalls.successData('Jobs for candidate found successfully', getJobs);
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const getHeaderCountForJobs = async (res) => {
    try {
        const condition = {};
        // get data based on user roles start
        if (res.tokenData.user_role === 'ats_superadmin' || res.tokenData.user_role === 'ats_super_admin' || res.tokenData.user_role === 'ats_admin' || res.tokenData.user_role === 'admin') {
            if (res.tokenData.ats_admin_id) {
                condition.ats_admin_id = ObjectId(res.tokenData.ats_admin_id);
            } else {
                condition.ats_admin_id = ObjectId(res.tokenData.user_id);
            }
        } else if (res.tokenData.user_role === 'ats_team_member') {
            const teamIds = [];
            const ctx = {};
            const requestConfig = {};
            const service = 'user-management-service';
            const path = '/engineers/get-teammember-id-axios/'+base64encode(String(res.tokenData.user_id));
            // const path = '/engineers/get-teammember-id-axios/NjQxMDNmOTU4ZDY5NjQzMmUzMGM4OGYx';
            const response = await request.get(ctx, service, path, requestConfig);
            const teamRes = response.data ? response.data.data : [];
            if (teamRes) {
                if (teamRes.teamIds) {
                    if (teamRes.teamIds.length > 0) {
                        for (let iu = 0; iu < teamRes.teamIds.length; iu++) {
                            teamIds.push(ObjectId(teamRes.teamIds[iu]._id));
                        }
                    }
                }
            }
            teamIds.push(ObjectId(res.tokenData.user_id));
            // condition.ats_user_id = { $in: teamIds };
            condition.$or = [
                { ats_user_id: { $in: teamIds } },
                { 'contact_person._id': { $in: teamIds } },
                { 'hiring_manager._id': { $in: teamIds } },
            ];
        } else if (res.tokenData.user_role === 'ats_restricted_team_member') {
            // condition.ats_user_id = ObjectId(res.tokenData.user_id);
            condition.$or = [
                { ats_user_id: ObjectId(res.tokenData.user_id) },
                { 'contact_person._id': ObjectId(res.tokenData.user_id) },
                { 'hiring_manager._id': ObjectId(res.tokenData.user_id) },
            ];
        }
        condition.platform_type = 'super-hire';

        // counts were not correct thus commented for sometime to rectify problem later
        // const getJobsCount = await Projects.aggregate([
        //     { $match: condition },
        //     {
        //         $group: {
        //             _id: '$project_status',
        //             count: { $sum: 1 },
        //         },
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             allCount: { $sum: { $cond: [{ $ne: ['$project_status', 'draft'] }, '$count', 0] } },
        //             openCount: { $sum: { $cond: [{ $eq: ['$project_status', 'posted'] }, '$count', 0] } },
        //             pausedCount: { $sum: { $cond: [{ $eq: ['$project_status', 'paused'] }, '$count', 0] } },
        //             draftCount: { $sum: { $cond: [{ $eq: ['$project_status', 'draft'] }, '$count', 0] } },
        //             closedCount: { $sum: { $cond: [{ $eq: ['$project_status', 'closed'] }, '$count', 0] } },
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             allCount: { $ifNull: [{ $first: '$allCount.count' }, 0] },
        //             openCount: { $ifNull: [{ $first: '$openCount.count' }, 0] },
        //             pausedCount: { $ifNull: [{ $first: '$pausedCount.count' }, 0] },
        //             draftCount: { $ifNull: [{ $first: '$draftCount.count' }, 0] },
        //             closedCount: { $ifNull: [{ $first: '$closedCount.count' }, 0] },
        //         },
        //     },
        // ]);
        const allCount = await Projects.find({ project_status: { $ne: 'draft' } }).countDocuments(condition);

        const openCount = await Projects.find({ project_status: 'posted' }).countDocuments(condition);

        const pausedCount = await Projects.find({ project_status: 'paused' }).countDocuments(condition);

        const closedCount = await Projects.find({ project_status: 'closed' }).countDocuments(condition);

        const draftCount = await Projects.find({ project_status: 'draft' }).countDocuments(condition);

        const responseData = {
            allCount,
            openCount,
            pausedCount,
            draftCount,
            closedCount,
        };
        return globalCalls.successData('Header count found successfully', responseData);
    } catch (error) {
        console.log(error.stack);
        return globalCalls.badRequestError(error.message);
    }
};

module.exports = {
    create,
    postJobATS,
    draftJobATS,
    list,
    job,
    jobListing,
    atsJobList,
    careerPageJobList,
    jobOfferDetails,
    jobDetailForAdmin,
    jobListForAdmin,
    getSingleProject,
    getATSJobDetails,
    getCareerJobDetails,
    projectUpdate,
    updateJobInteractionCount,
    jobsProjectCount,
    jobsWinLoss,
    WinAndLossJobList,
    updateIsWorldWideForExistingRecord,
    closedJobAvg,
    apiForOneTime,
    addTypeKeyforJob,
    addJobSettings,
    getJobSettings,
    updateJobSettings,
    apiForOneTimeForJobStatusDate,
    getSingleProjectClientDetail,
    moveATSJobStatusWise,
    cronCode,
    moveATSJobToOpenFromPaused,
    getJobAccordingToUserRole,
    apiForOneTimeRandNo,
    getJobsForCandidate,
    getHeaderCountForJobs,
    getFewDetailsOfProject,
};
