const config = require('../../config/awsConfig');
const { ObjectId } = require('mongodb');
const messageHub = require('@mayank_supersourcing/message-hub')(config);
const RequestMap = require('@mayank_supersourcing/request-map');
const Clients = require('./clientModels');
const { Projects } = require('../projects/projectsModel');
const globalCalls = require('../../utils/functions');
const { addClient } = require('./clientValidation');

const request = new RequestMap({ environment: process.env.ENVIRONMENT });

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 17-10-2022
 * Desc: To create client
 * Function: createClient
 * Api: clients
 */

const createClient = async (body) => {
    try {
        const comingData = body;
        if (!comingData.company_city) {
            comingData.company_city = comingData.location;
        }
        const validateAddClient = await addClient.validate(comingData);
        if (validateAddClient && validateAddClient.error && validateAddClient.error.details[0]) {
            return globalCalls.badRequestError(validateAddClient.error.details[0].message);
        }
        const saveClient = await Clients(comingData).save();
        if (saveClient) {
            return globalCalls.checkResponse(200, saveClient, 'Client saved successfully');
        } else {
            return globalCalls.badRequestError('Error, while saving the client');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const list = async (search, location, createdOn, page = 1, offset = 0, limit = 10) => {
    try {
        const perPage = 10;
        const pageRec = page || 1;
        const limitRec = limit ? parseInt(limit, 10) : perPage;
        let offsetRec = offset || limitRec * (pageRec - 1);
        offsetRec = parseInt(offsetRec, 10);
        const query = { isDelete: false };
        if (search) {
            query.client_name = { $regex: `.*${search}.*` };
        }
        if (location) {
            query.company_city = { $regex: `.*${location}.*` };
        }
        if (createdOn) {
            const startDate = new Date(createdOn);
            let endDate = new Date(createdOn);
            endDate = new Date(endDate.setDate(endDate.getDate() + 1));
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const clientCount = await Clients.find(query).countDocuments();
        const getClientNew = await Clients.aggregate([
            { $sort: { updatedAt: -1, createdAt: -1 } },
            { $match: query },
            { $skip: offsetRec },
            { $limit: limitRec },
            {
                $lookup: {
                    from: 'projects',
                    localField: '_id',
                    foreignField: 'client_id',
                    as: 'project_list',
                },
            },
            {
                $project: {
                    _id: 1,
                    client_name: 1,
                    company_website: 1,
                    linkedin_id: 1,
                    industry: 1,
                    team_size: 1,
                    recently_funded: 1,
                    company_city: 1,
                    company_state: 1,
                    company_country: 1,
                    location: 1,
                    about_company: 1,
                    how_do_you_found_us: 1,
                    isDelete: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                    'project_list._id': 1,
                    'project_list.no_requirements': 1,
                    'project_list.hired_count': 1,
                },
            },
        ]);

        // calculating project and project status count start//
        for (let i = 0; i < getClientNew.length; i += 1) {
            let pendingRequirment = 0;
            let hiredDeveloper = 0;
            getClientNew[i].project_count = getClientNew[i].project_list.length;

            if (getClientNew[i].project_list.length > 0) {
                for (let j = 0; j < getClientNew[i].project_list.length; j += 1) {
                    if (getClientNew[i].project_list[j].no_requirements) {
                        pendingRequirment = parseInt(pendingRequirment, 10) + parseInt(getClientNew[i].project_list[j].no_requirements, 10);
                    }
                    if (getClientNew[i].project_list[j].no_requirements) {
                        hiredDeveloper = parseInt(hiredDeveloper, 10) + parseInt(getClientNew[i].project_list[j].hired_count, 10);
                    }
                }
            }
            getClientNew[i].pending_requirment = pendingRequirment;
            getClientNew[i].hired_developer = hiredDeveloper;
            delete getClientNew[i].project_list;
        }
        // calculating project and project status count end////

        const response = {
            client_count: clientCount,
            data: getClientNew,
        };
        if (getClientNew) {
            return globalCalls.checkResponse(200, response, 'Client list fetched successfully');
        } else {
            return globalCalls.badRequestError('Error, while fetching the client');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const get = async (id, search, roles, techskills, createdOn, page = 1, offset = 0, limit = 10) => {
    try {
        const client = await Clients.find({ _id: id });
        const pageRec = page || 1;
        const limitRec = limit ? parseInt(limit, 10) : 10;
        let offsetRec = offset || limitRec * (pageRec - 1);
        offsetRec = parseInt(offsetRec, 10);

        const query = {};
        if (search) {
            query.project_id = { $regex: `.*${search}.*` };
        }
        if (roles) {
            const roleArr = roles.split(',');
            query['role.role'] = ({ $in: roleArr });
        }
        if (techskills) {
            const techskillsArr = techskills.split(',');
            query['primary_skills.skill'] = ({ $in: techskillsArr });
        }
        if (createdOn) {
            const startDate = new Date(createdOn);
            let endDate = new Date(createdOn);
            endDate = new Date(endDate.setDate(endDate.getDate() + 1));
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const projectData = await Projects.aggregate([
            { $sort: { createdAt: -1 } },
            { $match: query },
            { $skip: offsetRec },
            { $limit: limitRec },
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
                    client_price: 1,
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
                    tools_used: 1,
                    interested_count: 1,
                    interviewing_count: 1,
                    hired_count: 1,
                    rejected_count: 1,
                    project_id: 1,
                    'client_info._id': 1,
                    'client_info.name': 1,
                    'client_info.about_company': 1,
                },
            },
        ]);

        const total = await Projects.find(query).countDocuments();

        const requirementPostedCount = await Projects.aggregate([
            {
                $group: {
                    _id: 0, requirements: { $sum: '$client_price' }, developer_placed: { $sum: '$hired_count' }, interview_scheduled: { $sum: '$interviewing_count' },
                },
            },
        ]);

        if (client) {
            const responseData = {
                data: client,
                projectData,
                total,
                header_count: {
                    requirementPosted: total,
                    developerHired: 0,
                },
                requirementPostedCount,
            };
            return globalCalls.checkResponse(200, responseData, 'Client details get successfully');
        } else {
            return globalCalls.badRequestError('Error, while getting the client');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const update = async (id, data) => {
    try {
        const client = await Clients.findOne({ _id: ObjectId(id) });
        if (client) {
            await Clients.findByIdAndUpdate(id, data);
            await Projects.updateMany(
                { client_id: ObjectId(id) },
                { $set: { client_name: data.client_name } },
            );
            const snsSqsData = {
                conditions: {
                    client_id: id,
                },
                fields: {
                    client_name: data.client_name,
                },
            };
            await messageHub.publish(
                process.env.SNS_OUT_TOPIC_ARN,
                JSON.stringify({ ...snsSqsData, event: 'update_client_info' }),
            );
            return globalCalls.checkResponse(200, client, 'Client updated successfully');
        } else {
            return globalCalls.badRequestError('Error, while updating the client');
        }
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/** Under-testing (Incomplete)
 * Updated By: Shubham Kumar
 * Updated Date: 15-10-2022
 * Updated Desc: To delete client if no developer is hired by this client in any project
 * Function: destroy
 * */

const destroy = async (id) => {
    try {
        const client = await Clients.findById(id);
        if (client) 
        {
            // const clientProjects = await Projects.find({ client_id: id, hired_count: { $gte: 1 } });
            const clientProjects = await Projects.find({ client_id: id, job_status: "Win" });
            if (clientProjects.length > 0) {
                return globalCalls.badRequestError("You can't delete this client because some developer are hired on his projects."); // Bcz some projects posted by this client have hired developer
            }
            else{
                let isUpdatedClient = await Clients.updateOne(
                    { _id: id },
                    { $set: { isDelete: true } },
                );
                
                if(isUpdatedClient)
                {
                    const projectStatusUpdate = await Projects.updateMany(
                        {
                            client_id: id,
                        },
                        { $set: {
                            job_status: "Loss",
                            is_client_deleted: true,
                        }
                        });

                    //axios calling for job intraction update start
                    const ctx = {};
                    const requestConfig = {
                        // headers: { Authorization: req.headers.authorization },
                    };
                    const dataObj = {
                        "client_id":"633a73bd2f3ee83d0d8802ea"
                    };

                    const service = 'jobs-interaction-service';
                    const path = `/job-interaction/axios-job-status-update-on-client-delete`;
                    const response = await request.put(ctx, service, path, dataObj, requestConfig);
                    //axios calling for job intraction update end

                    return globalCalls.checkResponse(200, client, 'Client deleted successfully');
                }
                else{
                    return globalCalls.badRequestError('Somthing went wrong!');
                }
            }
        } else {
            return globalCalls.badRequestError('Client not found!');
        }
    
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

const clientSearch = async (search, limit = 5) => {
    try {
        const condition = {};
        condition.isDelete = false;
        if (search && search.length > 0) {
            condition.client_name = { $regex: `.*${search.toLowerCase()}.*` };
        }
        const clients = await Clients.aggregate([
            { $match: condition },
            { $limit: parseInt(limit, 10) },
            {
                $project: {
                    _id: 1,
                    client_name: 1,
                },
            },
        ]);

        const responseData = {
            clients,
            total: clients.length,
        };
        return globalCalls.checkResponse(200, responseData, 'Client searched successfully');
    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

/**
 * Created By: Shubam Kumar
 * Created Date: 17-10-2022
 * Desc: To see all projects in which poc is whose id is passed (User in axios in user mgmt)
 * Function: projectAssociatedWithPoc
 * Api:project-associated-with-poc
 */

const projectAssociatedWithPoc = async (pocId) => {
    try {
        let projects_text;
        const projectsCount = await Projects.find({ client_poc: { $elemMatch: { _id: pocId.toString() } } });//.countDocuments();
        if (projectsCount.length == 0) {
        //if (projectsCount <= 0) {
            return {
                statusCode: 422,
                body: {
                    projects: "",
                    project_count: 0,
                },
                message: 'No projects associated with poc',
            };
        } else {
            /* const removePocData = {
                user_id: pocId,
            }; messageHub.publish(
                process.env.SNS_OUT_TOPIC_ARN,
                JSON.stringify({ removePocData, event: 'remove_poc' }),
            ); */

            let project_name = [];
            for(i=0; i<projectsCount.length; i++){
                if(projectsCount[i] && projectsCount[i].project_id)
                {
                    project_name.push(projectsCount[i].project_id);
                }
                else if(projectsCount[i] && projectsCount[i].role)
                {
                    let roleArray = [];
                    let role_text;
                    for(i_role=0; i_role<projectsCount[i].role.length; i_role++){
                        roleArray.push(projectsCount[i].role[i_role].role);
                    }
                    role_text = roleArray.join(", ");
                    project_name.push("Roles-"+role_text);
                }
                else if(projectsCount[i] && projectsCount[i].client_name)
                {
                    project_name.push("ClientName-"+projectsCount[i].client_name);
                }
            }
            projects_text = project_name.join(", ");
        }
        
        return {
            statusCode: 200,
            body: {
                projects: projects_text,
                project_count: projectsCount.length,
            },
            message: 'projects associated with poc found successfully.',
        };

    } catch (error) {
        return globalCalls.badRequestError(error.message);
    }
};

module.exports = {
    createClient,
    list,
    get,
    destroy,
    update,
    clientSearch,
    projectAssociatedWithPoc,
};
