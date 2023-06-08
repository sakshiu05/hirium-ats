const cron = require('node-cron');
const Projects = require('../projects/projectsController');

/**
 * Created By: Shubhankar Kesharwani
 * Created Date: 07-02-2023
 * Desc: To display individual developer old jobs on top
 * Method: PUT
 * API: projects/cronCode
 * Function: cronCode
 */

/*
+------------------- second (0 - 59)
|  +---------------- minute (0 - 59)
|  |  +------------- hour (0 - 23)
|  |  |  +---------- day of month (1 - 31)
|  |  |  |  +------- month (1 - 12)
|  |  |  |  |  +---- day of week (0 - 6) (Sunday=0 or 7)
|  |  |  |  |  |
*  *  *  *  *  *  command to be executed
*/

cron.schedule('0 0 * * *', async () => { // Run every day 12 AM
    const aa = await Projects.cronCode();
    console.log('Cron running every half an hour from cronController', aa);
});
