const { Projects } = require('../projects/projectsModel');
const globalCalls = require('../../utils/functions');

function padDates(jobs, startDate, endDate) {
    // check if data for any date is missing and add it with count 0
    const dateMap = {};
    const dateArray = [];
    const dateArrayLength = jobs.length;
    const currentDate = new Date(startDate);
    endDate = new Date(endDate);
    while (currentDate <= endDate) {
        dateMap[currentDate.toISOString().slice(0, 10)] = 0;
        dateArray.push(currentDate.toISOString().slice(0, 10));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    for (let i = 0; i < dateArrayLength; i += 1) {
        const date = jobs[i].date;
        dateMap[date] = jobs[i].count;
    }
    const jobsGraph = [];
    for (let i = 0; i < dateArray.length; i += 1) {
        jobsGraph.push({
            date: dateArray[i],
            count: dateMap[dateArray[i]],
        });
    }
    return jobsGraph;
}

function padArray(jobsGraphArray) {
    if (jobsGraphArray.length < 12) {
        const padLength = 12 - jobsGraphArray.length;
        for (let i = 0; i < padLength; i += 1) {
            jobsGraphArray.push(0);
        }
    }
    return jobsGraphArray;
}

const generateGraphArray = async (
    startDate,
    endDate,
    status,
    groupBy = 'weekly',
) => {
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);
    let dateFormat = '%Y-%m-%d'; // Default to grouping by day
    if (groupBy === 'yearly') {
        dateFormat = '%Y-%m';
    } else if (groupBy === 'monthly') {
        dateFormat = '%Y';
    }
    console.log('dateFormat', dateFormat, 'groupBy', groupBy);
    try {
        let match = {
            platformType: { $ne: 'super-hire' },
            createdAt: { $gte: startDate, $lte: endDate },
        };
        let groupingKey = '$createdAt';
        if (status === 'closed') {
            match = {
                platformType: { $ne: 'super-hire' },
                job_status_date: { $gte: startDate, $lte: endDate },
                job_status: { $in: ['Win', 'Loss'] },
            };
            groupingKey = '$job_status_date';
        }
        console.log(match);
        const jobs = await Projects.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormat,
                            date: groupingKey,
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        jobs.forEach((job) => {
            job.date = job._id;
            delete job._id;
        });
        console.log('jobs', jobs);
        let jobsGraph = [];
        if (groupBy === 'weekly') {
            jobsGraph = padDates(jobs, startDate, endDate);
        } else jobsGraph = jobs;
        let jobsGraphArray = jobsGraph.map((job) => job.count);
        if (groupBy === 'yearly') {
            jobsGraphArray = padArray(jobsGraphArray);
        }
        // console.log('jobsGr', jobs);
        return jobsGraphArray;
    } catch (error) {
        console.error(error);
        return [];
    }
};

const getOpenJobIds = async () => {
    const jobs = await Projects.find({ project_status: 'posted' }, { _id: 1 });
    const jobIds = jobs.map((job) => job._id);
    return globalCalls.checkResponse(200, jobIds, 'jobs retrieved');
};

const getJobsGraphData = async (startDate, endDate, groupBy) => {
    let openJobsGraphArray = await generateGraphArray(
        startDate,
        endDate,
        'open',
        groupBy,
    );
    let closedJobsGraphArray = await generateGraphArray(
        startDate,
        endDate,
        'closed',
        groupBy,
    );
    if (openJobsGraphArray.length === 0) openJobsGraphArray = [0];
    if (closedJobsGraphArray.length === 0) closedJobsGraphArray = [0];
    return globalCalls.checkResponse(
        200,
        { openJobs: openJobsGraphArray, closedJobs: closedJobsGraphArray },
        'jobs graph data retrieved',
    );
};

const getJobSkills = async () => {
    const jobs = await Projects.find({}, { primary_skills: 1 });
    let skills = jobs.map((job) =>
        job.primary_skills.map((skill) => skill.skill),
    );

    // convert array of arrays to single array
    skills = skills.reduce((acc, val) => acc.concat(val), []);

    // remove duplicates
    skills = [...new Set(skills)];

    return globalCalls.checkResponse(200, { skills }, 'skills');
};
module.exports = {
    getOpenJobIds,
    getJobsGraphData,
    getJobSkills,
};
