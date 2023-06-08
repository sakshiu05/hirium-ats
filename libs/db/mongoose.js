const mongoose = require('mongoose');

const URI = process.env.MONGO_CONNECTION_STRING;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

(async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(URI, options);
        console.log('established connection to mongodb');
    } catch (error) {
        console.log(error);
    }
})();

module.exports = mongoose;
