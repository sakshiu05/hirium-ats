const Joi = require('joi');

const addJobs = Joi.object({
    client_name: Joi.string().required().messages({ 'any.required': 'Client name is required.' }),
    client_poc: Joi.array()
        .items({
            client_poc: Joi.string(),
            _id: Joi.string(),
            comment: Joi.string(),
            designation: Joi.string(),
            email: Joi.string(),
            mobile_number: Joi.string(),

        }).required().messages({ 'any.required': 'Client Poc name is required.' }),
    role: Joi.array().required().messages({ 'any.required': 'Role is required.' }),
    expectations: Joi.string(),
    working_time_zone: Joi.array(),
    experience_range: Joi.array().required().messages({ 'any.required': 'Experience is required.' }),
    client_price: Joi.number().required().messages({ 'any.required': 'Client price is required.' }),
    ss_price: Joi.number().required().messages({ 'any.required': 'Supersourcing price is required.' }),
    month_of_engagement: Joi.array().required().messages({ 'any.required': 'Month of engagement is required.' }),
    engagement_type: Joi.array().required().messages({ 'any.required': 'Engagement type is required.' }),
    no_requirements: Joi.number().required().messages({ 'any.required': 'No.of requirement is required.' }),
    tentative_start: Joi.array().required().messages({ 'any.required': 'Tentative start date is required.' }),
    primary_skills: Joi.array().required().messages({ 'any.required': 'Primary Skills is required.' }),
    competency: Joi.array(),
    secondary_skills: Joi.array().required().messages({ 'any.required': 'Secondary Skills is required.' }),
    working_hours: Joi.number().required().messages({ 'any.required': 'Working hours is required.' }),
    travel_preference: Joi.array(),
    // location: Joi.string(),
    // job_city: Joi.string(),
    job_state: Joi.string(),
    job_country: Joi.string(),
    tools_used: Joi.array(),
    system_provided: Joi.array().required().messages({ 'any.required': 'System provided is required.' }),
    no_of_rounds: Joi.number(), // .required().messages({ 'any.required': 'No.of rounds is required.' }), //! Removed on update
    interview_rounds: Joi.array(), // .required().messages({ 'any.required': 'Interview round is required.' }), //! Removed on update
    communication_skill: Joi.array().required().messages({ 'any.required': 'Communication Skill is required.' }),
    job_responsibility: Joi.string(),

    is_world_wide: Joi.boolean().required().messages({ 'any.required': 'Is world wide key is required.' }),
    location: Joi.when('is_world_wide', {
        is: Joi.boolean().valid(false),
        then: Joi.string().required().messages({ 'any.required': 'Location is required.' }),
    }),
    job_city: Joi.when('is_world_wide', {
        is: Joi.boolean().valid(false),
        then: Joi.string().required().messages({ 'any.required': 'Job city is required.' }),
    }),
    sales_poc: Joi.array().required().messages({ 'any.required': 'Sales poc is required.' }),
});

const jobStatusValidation = Joi.object({
    job_status: Joi.string().required().messages({ 'any.required': 'Job Status is required.' }),
});

const addJobsATS = Joi.object({
    department: Joi.string(),
    client_name: Joi.string(),
    tentative_start: Joi.array(),
    responsibility_and_expectations: Joi.string(),
    perks_and_benefits: Joi.string(),
    job_title: Joi.string(),
    cooling_period: Joi.string(),
    ats_tenant_id: Joi.string(),
    job_type: Joi.string(),
    experience_level: Joi.array(),
    travel_preference: Joi.array(),
    preffered_location: Joi.array(),
    education_type: Joi.array(),
    primary_skills: Joi.array(),
    field_of_study: Joi.string(),
    requirement: Joi.string(),
    no_of_requirements: Joi.number(),
    skills_required: Joi.array(),
    hiring_manager: Joi.array(),
    contact_person: Joi.array(),
    interview_rounds_ats: Joi.array(),
    cooling_period_department: Joi.array(),
    cooling_period_location: Joi.array(),
    platform_type: Joi.string(),
    ats_user_id: Joi.string(),
    ats_admin_id: Joi.string(),
    type: Joi.string().required(),
    project_status: Joi.string(),
    show_in_jd: Joi.boolean(),
    currency: Joi.string(),
    max_salary_range: Joi.when('type', {
        is: 'ats-fulltime',
        then: Joi.string(),
        otherwise: Joi.forbidden(),
    }),
    min_salary_range: Joi.when('type', {
        is: 'ats-fulltime',
        then: Joi.string(),
        otherwise: Joi.forbidden(),
    }),
    max_exp_range: Joi.when('type', {
        is: 'ats-fulltime',
        then: Joi.string().required(),
        otherwise: Joi.when('type', {
            is: 'ats-contract',
            then: Joi.string().required(),
        }),
    }),
    min_exp_range: Joi.when('type', {
        is: 'ats-fulltime',
        then: Joi.string().required(),
        otherwise: Joi.when('type', {
            is: 'ats-contract',
            then: Joi.string().required(),
        }),
    }),
    stipend: Joi.when('type', {
        is: 'ats-internship',
        then: Joi.boolean(),
        otherwise: Joi.forbidden(),
    }),
    stipend_amount: Joi.when('stipend', {
        is: Joi.boolean().valid(true),
        then: Joi.string(),
        otherwise: Joi.forbidden(),
    }),
    internship_duration: Joi.when('type', {
        is: 'ats-internship',
        then: Joi.array(),
        otherwise: Joi.forbidden(),
    }),
    project_duration: Joi.when('type', {
        is: 'ats-contract',
        then: Joi.array(),
        otherwise: Joi.forbidden(),
    }),
    project_salary: Joi.when('type', {
        is: 'ats-contract',
        then: Joi.string(),
        otherwise: Joi.forbidden(),
    }),
    // secret_access_key: Joi.string(),
});

addJobsATS.validate();
addJobs.validate();
jobStatusValidation.validate();

const jobSettingsValidate = Joi.object({
    ats_tenant_id: Joi.string().required().messages({ 'any.required': 'Please enter tenant Id' }),
    ats_user_id: Joi.string().required().messages({ 'any.required': 'Please enter user Id' }),
    ats_admin_id: Joi.string(),
    backgroud_color: Joi.string(),
    logo: Joi.string(),
    logo_name: Joi.string(),
    logo_position: Joi.string(),
    show_logo: Joi.boolean(),
    banner_background_color: Joi.string(),
    show_banner: Joi.boolean(),
    job_page_title: Joi.string(),
    job_page_title_color: Joi.string(),
    job_page_subtitle: Joi.string(),
    job_page_subtitle_color: Joi.string(),
    search_box_text: Joi.string(),
    show_search_box: Joi.boolean(),
    job_card_heading_color: Joi.string(),
    job_sub_heading_color: Joi.string(),
    buttons_color: Joi.string(),
});
jobSettingsValidate.validate();

module.exports = {
    addJobs,
    jobStatusValidation,
    addJobsATS,
    jobSettingsValidate,
};
