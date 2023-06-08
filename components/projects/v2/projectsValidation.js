const Joi = require('joi');

const talentManagerAssociate = Joi.object({
    project_id: Joi.string().required().messages({ 'any.required': 'Please enter project id' }),
    talent_associate_id: Joi.string().required().messages({ 'any.required': 'Please select talent associate id' }),
    first_name: Joi.string().required().messages({ 'any.required': 'Please select first name' }),
    last_name: Joi.string().required().messages({ 'any.required': 'Please select last name' }),
    profile_pic: Joi.string(),
});
talentManagerAssociate.validate();

const jobHoldOpenValidation = Joi.object({
    status: Joi.string().valid('On-Hold', 'open'),
});
jobHoldOpenValidation.validate();

module.exports = {
    jobHoldOpenValidation,
    talentManagerAssociate,
};
