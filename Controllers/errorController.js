const CustomError = require("../Error/CustomError")


const devErrors = (res, error) => {
    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
        stackTrace: error.stack,
        error: error
    })
}

const proErrors = (res, error) => {

    if (error.isOperational) {

        //when we create Custom Error

        res.status(error.statusCode).json({
            status: error.statusCode,
            message: error.message
        })

    } else {

        res.status(500).json({
            status: 'Error',
            message: 'Something Went Wrong! .... please contact the developed company'
        })

    }

}

const castErrorHandler = (err) => {
    const msg = `Invalid Value for ${err.path}: ${err.value}`;

    return new CustomError(msg, 400);

}

const duplicateKeyErrorHandler = (err) => {
    const msg = `There is already a movie with name ${err.keyValue.name}. Please change the name and try again`;
    return new CustomError(msg, 400);
}

const validationErrorHandler = (err) => {
    const errors = Object.values(err.errors).map(val => val.message);
    const errorMessages = errors.join('. ');
    const msg = `Invalid input data : ${errorMessages}`;
    return new CustomError(msg, 400);
}

const handleExpiredJWT = (err) => {
    const msg = `JWT has expired .... please login again!`;

    return new CustomError(msg, 401);
}

const handleJWTError = () => {
    const msg = `Invalid Token .... please login again!`;

    return new CustomError(msg, 401);
}

const globalErrorHandler = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'Error';

    if (process.env.NODE_ENV === 'development') {

        devErrors(res, error);

    }
    else if (process.env.NODE_ENV === 'production') {

        switch (error.name) {
            case 'CastError':
                error = castErrorHandler(error);
                break;

            case 'ValidationError':
                error = validationErrorHandler(error);
                break;
            case 'TokenExpiredError':
                error = handleExpiredJWT(error);
                break;
            case 'JsonWebTokenError':
                error = handleJWTError(error);
                break;

            default:
                break;
        }

        switch (error.code) {
            case 11000:
                error = duplicateKeyErrorHandler(error)
                break;

            default:
                break;
        }



        proErrors(res, error);

    }

}

module.exports = globalErrorHandler;