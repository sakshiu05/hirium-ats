const { Schema, model } = require('mongoose');
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const clientSchema = new Schema(
    {
        client_name: {
            type: String, lowercase: true, required: true, trim: true,
        },
        company_website: { type: String, trim: true },
        linkedin_id: { type: String, trim: true },
        industry: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        team_size: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        recently_funded: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        company_city: {
            type: String, lowercase: true, trim: true,
        },
        company_state: {
            type: String, lowercase: true, required: false, trim: true,
        },
        company_country: {
            type: String, lowercase: true, required: false, trim: true,
        },
        location: { type: String, trim: true },
        about_company: {
            type: String, lowercase: true, trim: true,
        },
        how_do_you_found_us: [
            {
                _id: { type: Schema.Types.ObjectId, required: false },
                data: { type: String, required: false },
            },
        ],
        isDelete: { type: Boolean, default: false },
    },
    { collection: 'clients', timestamps: true },
);

clientSchema.plugin(paginate);
clientSchema.plugin(aggregatePaginate);
const Clients = model('Clients', clientSchema);
module.exports = Clients;
