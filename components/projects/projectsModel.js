const { Schema, model } = require('mongoose');
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const autoIncrementModelID = require('../../utils/counterModel');

const projectSchema = new Schema(
    {
        project_id: { type: String, unique: true, min: 1 },
        client_name: { type: String, lowercase: true, required: true },
        client_id: { type: Schema.Types.ObjectId, required: false }, // store clients object id
        client_poc: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: Object, required: false },
                email: { type: String, required: false },
                mobile_number: { type: String, required: false },
                client_poc: { type: String, required: false },
                designation: { type: String, required: false },
                comment: { type: String, required: false },
            },
        ],
        role: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                role: { type: String, required: false },
            },
        ],
        experience_range: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        client_price: { type: Number, required: false, select: false },
        ss_price: { type: Number, required: false },
        month_of_engagement: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        engagement_type: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        no_requirements: { type: Number, required: false },
        tentative_start: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        expectations: { type: String, required: false },
        secondary_skills: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                skill: { type: String, required: false },
            },
        ],
        primary_skills: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                skill: { type: String, required: false },
                competency: [
                    {
                        _id: { type: Schema.Types.ObjectId, required: false },
                        data: { type: String, required: false },
                    },
                ],
            },
        ],
        working_time_zone: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                label: { type: String, required: false },
                data: { type: String, required: false },
            },
        ],
        working_hours: { type: Number, required: false },
        travel_preference: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: true },
            },
        ],
        job_city: {
            type: String, lowercase: true, required: false, trim: true,
        },
        job_state: {
            type: String, lowercase: true, required: false, trim: true,
        },
        job_country: {
            type: String, lowercase: true, required: false, trim: true,
        },
        location: { type: String, required: false, trim: true },
        tools_used: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        system_provided: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        no_of_rounds: { type: Number, required: false },
        interview_rounds: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                round_number: { type: Number, required: false },
                round_name: { type: String, required: false },
                auto_rejection: { type: Boolean, required: false },
                auto_rejection_value: { type: Number, required: false },
                auto_rejection_unit: { type: String, required: false },
            },
        ],
        communication_skill: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        job_responsibility: { type: String, required: false },
        interested_count: { type: Number, default: 0 },
        interviewing_count: { type: Number, default: 0 },
        hired_count: { type: Number, default: 0 },
        rejected_count: { type: Number, default: 0 },
        shortlisted_count: { type: Number, default: 0 },
        job_status: {
            type: String,
            required: false,
            enum: ['Win', 'Loss', 'On-Hold'],
        },
        job_status_date: { type: Date, required: false },
        is_world_wide: {
            type: Boolean, required: false, default: false, trim: true,
        },
        is_client_deleted: {
            type: Boolean, required: false, default: false, trim: true,
        },
        responsibility_and_expectations: { type: String, required: false },
        perks_and_benefits: { type: String, required: false },
        client_price_end: { type: Number, required: false, select: false },
        job_title: { type: String, required: false, trim: true },
        job_platform: {
            type: String, required: false, default: 'supersourcing', trim: true,
        },
        designation: { type: String, required: false, trim: true },
        // education_type: { type: String, required: false, trim: true },
        education_specialization: { type: String, required: false, trim: true },
        cooling_period: {
            type: String,
            required: false,
            enum: ['1 Month', '2 Month', '3 Month', '4 Month', '5 Month', '6 Month'],
        },
        offer_sent_count: { type: Number, default: 0, required: false },
        offer_reject_count: { type: Number, default: 0, required: false },
        comment_closed: { type: String, required: false, trim: false },
        comment_pause: { type: String, required: false, trim: false },
        published_to_jobportal: {
            type: String,
            required: false,
            enum: ['careerpage', 'linkedin', 'monster', 'cutshort', 'google'],
        },
        department: { type: String, required: false },
        // job_type: { type: String, required: false },
        experience_level: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        // job_preference: { type: String, required: true, enum: ['on-site', 'hybrid', 'remote'] },
        preffered_location: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                location_name: { type: String, required: false },
                city: { type: String, required: false },
                state: { type: String, required: false },
                country: { type: String, required: false },
            },
        ],
        max_salary_range: { type: String, required: false },
        min_salary_range: { type: String, required: false },
        show_in_jd: { type: Boolean, required: false, default: false },
        stipend: { type: Boolean, required: false },
        stipend_amount: { type: String, required: false },
        max_exp_range: { type: String, required: false },
        min_exp_range: { type: String, required: false },
        platform_type: { type: String, required: false, default: 'pre-hire' },
        ats_user_id: { type: Schema.Types.ObjectId, required: false, immutable: true },
        ats_admin_id: { type: Schema.Types.ObjectId, required: false, immutable: true },
        ats_tenant_id: { type: Schema.Types.ObjectId, required: false, immutable: true },
        // If you need to override this behavior in certain cases, you can use the findByIdAndUpdate() method with the runValidators option set to true. This will cause Mongoose to run validation on the update operation, which can include updates to immutable fields.
        // findByIdAndUpdate(id, { $set: { name: 'new name', age: 30, email: 'newemail@example.com' } }, { runValidators: true })
        education_type: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        field_of_study: { type: String, required: false },
        no_of_requirements: { type: Number, required: false },
        // tentative_start: [
        //     {
        //         _id: { type: Schema.Types.ObjectId, required: false },
        //         data: { type: String, required: false },
        //     },
        // ],
        // skills_required: [
        //     {
        //         id: { type: Schema.Types.ObjectId, required: false },
        //         skill: { type: String, required: false },
        //     },
        // ],
        requirement: { type: String, required: false },
        // responsibility_and_expectations: { type: String, required: false },
        // perks_and_benefits: { type: String, required: false },
        hiring_manager: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                first_name: { type: String, required: false },
                last_name: { type: String, required: false },
                email: { type: String, required: false },
                profile_pic: { type: String, required: false },
            },
        ],
        contact_person: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                first_name: { type: String, required: false },
                last_name: { type: String, required: false },
                email: { type: String, required: false },
                profile_pic: { type: String, required: false },
            },
        ],
        // no_of_rounds: { type: Number, required: true },
        interview_rounds_ats: [
            {
                interview_type: { type: String, required: true },
                assessment_platform: { type: String, required: false },
                skill_for_assessment: [
                    {
                        id: { type: Schema.Types.ObjectId, required: false },
                        skill: { type: String, required: false },
                    },
                ],
                rejction_process: {
                    type: String, required: false, default: 'automatic', enum: ['automatic', 'manual'],
                },
                max_rejection_score: { type: String, required: false },
                interviewer: [
                    {
                        _id: { type: Schema.Types.ObjectId, required: false },
                        first_name: { type: String, required: false },
                        last_name: { type: String, required: false },
                        email: { type: String, required: false },
                        profile_pic: { type: String, required: false },
                    },
                ],
            },
        ],
        cooling_period_department: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        cooling_period_location: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                location_name: { type: String, required: false },
                city: { type: String, required: false },
                state: { type: String, required: false },
                country: { type: String, required: false },
            },
        ],
        internship_duration: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        project_duration: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        project_salary: { type: String, required: false },
        type: { type: String, required: true, enum: ['premium-job', 'ats-fulltime', 'ats-internship', 'ats-contract'] },
        project_status: {
            type: String, required: false, default: 'draft', enum: ['draft', 'posted', 'closed', 'paused'],
        },
        // isDelete: { type: Boolean, required: false, default: false, trim: true },
        // deleted_by_id: { type: Schema.Types.ObjectId, required: false },
        currency: { type: String, required: false },
        reason_for_job_close: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        reason_for_job_paused: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        cron_date: { type: Date, required: false },
        rand_no: { type: Number, required: false }, // rand no generate on job post api for display dummy show_interested cout uiser side.
        // secret_access_key: { type: String, required: true },
        sales_poc: [
            {
                team_member_id: { type: Schema.Types.ObjectId, required: true },
                first_name: { type: String, required: true },
                last_name: { type: String, required: true },
                profile_pic: { type: String, required: false },
            },
        ],
        talent_manager_associate: [
            {
                talent_associate_id: { type: Schema.Types.ObjectId, required: true },
                first_name: { type: String, required: true },
                last_name: { type: String, required: true },
                profile_pic: { type: String, required: false },
                createdAt: { type: Date, required: true },
            },
        ],
        status: {
            type: String, required: false, default: 'open', enum: ['open', 'assigned'],
        },
    },
    { collection: 'projects', timestamps: true },
);
projectSchema.plugin(paginate);
projectSchema.plugin(aggregatePaginate);
projectSchema.pre('save', function (next) {
    if (!this.isNew) {
        next();
        return;
    }
    autoIncrementModelID('project_counter', 'projects', this, next);
});

const jobSettingsSchema = new Schema(
    {
        ats_tenant_id: { type: Schema.Types.ObjectId, required: [true, 'Tenant Id is required'], immutable: true },
        ats_user_id: { type: Schema.Types.ObjectId, required: [true, 'ATS User Id is required'], immutable: true },
        ats_admin_id: { type: Schema.Types.ObjectId, required: false, immutable: true },
        backgroud_color: { type: String, required: false, default: '#ffffff' },
        logo: { type: String, required: false },
        logo_name: { type: String, required: false },
        logo_position: { type: String, required: false, default: 'left' }, // left/center/right
        show_logo: { type: Boolean, required: false, default: true },
        banner_background_color: { type: String, required: false, default: '#000000' },
        show_banner: { type: Boolean, required: false, default: true },
        job_page_title: { type: String, required: false },
        job_page_title_color: { type: String, required: false, default: '#000000' },
        job_page_subtitle: { type: String, required: false },
        job_page_subtitle_color: { type: String, required: false, default: '#000000' },
        search_box_text: { type: String, required: false },
        show_search_box: { type: Boolean, required: false, default: true },
        job_card_heading_color: { type: String, required: false, default: '#1C2833' },
        job_sub_heading_color: { type: String, required: false, default: '#777E85' },
        buttons_color: { type: String, required: false, default: '#5A43FF' },
        show_header: { type: Boolean, required: false, default: true },
    },
    { timestamps: true },
);
const Projects = model('Projects', projectSchema);
const jobSettings = model('jobSettings', jobSettingsSchema);

module.exports = {
    Projects,
    jobSettings,
};
