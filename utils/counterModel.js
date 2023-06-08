const mongoose = require('mongoose');

const { Schema } = mongoose;

const counterSchema = new Schema(
    {
        _id: { type: String, required: true },
        seq: { type: Number, default: 0 },
    },
);

counterSchema.index({ _id: 1, seq: 1 }, { unique: true });

const autoIncrementModelID = function (counterName, modelName, doc, next) {
    const counterModel = mongoose.model(counterName, counterSchema);

    counterModel.findByIdAndUpdate( // ** Method call begins **
        modelName, // The ID to find for in counters model
        { $inc: { seq: 1 } }, // The update
        { new: true, upsert: true }, // The options
        (error, counter) => {
            if (error) return next(error);
            doc.project_id = `${String(doc.client_name.slice(0, 3)).toUpperCase()}000${String(counter.seq)}`;
            next();
        },
    );
};

module.exports = autoIncrementModelID;
