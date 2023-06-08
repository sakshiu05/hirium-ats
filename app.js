const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

const serverless = require('serverless-http');

const swaggerUi = require('swagger-ui-express');
const messageHub = require('@mayank_supersourcing/message-hub')(require('./config/awsConfig'));
const swaggerDocument = require('./components/swaggerDocumentation.json');

require('dotenv').config({ path: 'config/.env' });
require('./libs/db/mongoose');
require('./components/cron/controller');
const indexRouter = require('./components/indexRouter');

const app = express();
app.use(logger('dev'));
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/v1', indexRouter);
app.use('/job-management-service/api/v1', indexRouter);
app.use('/dev/job-management-service/api/v1', indexRouter);
app.use(
    '/dev/job-management-service/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument),
);
app.use(
    '/job-management-api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument),
);

// Initialize event manager
const eventManager = require('./services/eventManager');

// subscribe message-hub listener for incoming events
messageHub.subscribe(process.env.SQS_IN_QUEUE_URL, (message) => {
    // console.log(message);
    eventManager.eventManager(message);
});

app.use('/', (req, res) => res.status(404).json({ status: false, message: 'route not found' }));

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// CORS error slove start
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
    res.header('Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
// CORS error slove start end

// error handler
app.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json({ error: err });
});

module.exports = { app, handler: serverless(app) };
