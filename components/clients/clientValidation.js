const Joi = require('joi');

const addClient = Joi.object({
    client_name: Joi.string().required().messages({ 'any.required': 'Client name is required.' }),
    company_website: Joi.string().allow(null, ''),
    linkedin_id: Joi.string().allow(null, ''),
    industry: Joi.array(),
    team_size: Joi.array(),
    recently_funded: Joi.array(),
    location: Joi.string().allow(null, ''),
    company_city: Joi.string().allow(null, ''),
    company_state: Joi.string().allow(null, ''),
    company_country: Joi.string().allow(null, ''),
    about_company: Joi.string().allow(null, ''),
    how_do_you_found_us: Joi.array(),
});
addClient.validate();
module.exports = {
    addClient,
};
