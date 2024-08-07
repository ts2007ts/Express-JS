const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan')
const moviesRouter = require('./Routes/moviesRoutes');
const authRouter = require('./Routes/authRoutes');
const userRouter = require('./Routes/userRoutes');
const CustomError = require('./Error/CustomError');
const globalErrorHandler = require('./Controllers/errorController');
const rateLimit = require('express-rate-limit');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const httpParameterPollution = require('hpp');

const app = express();

//create limiter to limit the request to the server to avoid brute force attack/Denial of service
let limiter = rateLimit({
    max: 100,
    windowMs: 1 * 60 * 60 * 1000, //time frame 1 hr
    message: 'We have received too many requests from this ip ... please try after one hour'
});
app.use('/api', limiter);

//create helmet for security headers
app.use(helmet());

// For parsing application/json
app.use(express.json({ limit: '10kb' }));

//sanitize the request 
app.use(sanitize());

//clean any user input from malicious html code
app.use(xss());

//avoid parameter pollution like ?sort=duration&sort=price
app.use(httpParameterPollution({
    whitelist: [
        'duration',
        'ratings',
        'releaseYear',
        'releaseDate',
        'genres',
        'directors',
        'actors',
        'price'
    ]
}));

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

//read from public
app.use(express.static('/public'));

//ROUTER HANDLER FUNCTIONS
app.use('/api/v1/movies', moviesRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {

    const err = new CustomError(`Can't find ${req.originalUrl} on the server`, 404)

    next(err);
});

app.use(globalErrorHandler);

module.exports = app;

