/* eslint-disable indent */

const { extractEvent } = require('@mayank_supersourcing/event-extractor');
require('dotenv').config({ path: '../config/.env' });

const projectController = require('../components/projects/projectsController');

async function eventManager(event) {
    try {
        const parsedEvent = JSON.parse(JSON.parse(event.Body).Message);
        switch (parsedEvent.event) {
            case 'increase_count': {
                // { event: 'increase_count', project_id: data.project_id, type: "interested_count" || interviewing_count || hired_count || rejected_count }
                delete parsedEvent.event;
                console.log('received increase_count event', parsedEvent);
                const resp = await projectController.updateJobInteractionCount(parsedEvent);
                console.log(resp);
                break;
            }
            default: {
                console.log('unknown event', parsedEvent);
            }
        }
    } catch (error) {
        console.log('error in eventManager', error);
    }
}

async function handler(event, context) {
    console.log('---------------event: ', event);
    console.log('---------------context: ', context);
    console.log('Event');
    const extractedEvent = extractEvent(event);
    await eventManager(extractedEvent);
}

module.exports = { eventManager, handler };
