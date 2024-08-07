const User = require('../Models/userModel');
const asyncErrorHandler = require('../Error/asyncErrorHandler');
const CustomError = require('../Error/CustomError');
const jwt = require('jsonwebtoken');
const util = require('util');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign(
        { id },
        process.env.SECRET_STR,
        {
            expiresIn: process.env.TOKEN_EXPIRES
        }
    )
}

const createResponse = (user, statusCode, token, res) => {

    const options = {
        maxAge: 172800000, //2 days
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') {
        options.secure = true
    }

    //cookie helps us to prevent cross site scripting attacks
    const cookie = res.cookie('jwt', token, options);

    //set password to undefined 
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token: token,
        data: {
            user: user,
        }
    })
}


exports.registerUser = asyncErrorHandler(async (req, res, next) => {

    const user = await User.create(req.body);

    const token = signToken(user._id);

    createResponse(user, 201, token, res);

})

exports.login = asyncErrorHandler(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        msg = "Email and Password are required fields";
        const error = new CustomError(msg, 400);
        return next(error);
    }

    //Check if user exists with the credentials 
    const user = await User.findOne({ email }).select('+password');

    //Compare passwords
    // const matched = await user.comparePasswords(password, user.password);

    if (!user || !(await user.comparePasswords(password, user.password))) {
        msg = "Credentials are not correct! ... please check and try again";
        const error = new CustomError(msg, 401);
        return next(error);
    }

    const token = signToken(user._id);

    createResponse(user, 200, token, res);
})

exports.protect = asyncErrorHandler(async (req, res, next) => {

    //1. Read the token & check if it exist
    const receivedToken = req.headers.authorization;
    let token;
    if (receivedToken && receivedToken.startsWith('bearer') || receivedToken && receivedToken.startsWith('Bearer')) {
        token = receivedToken.split(' ')[1];
    }

    if (!token) {
        const error = new CustomError('You are not logged in!', 401);
        return next(error);
    }

    //2. validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);

    //3. if the user exists
    const user = await User.findById(decodedToken.id);

    if (!user) {
        const error = new CustomError('The User with given token not found!', 404);
        return next(error);
    }

    //4. if the user changed password after the token was issued

    if (await user.isPasswordChanged(decodedToken.iat)) {
        const error = new CustomError('The password has been changed recently ... please login again', 401);
        return next(error);
    }
    //5. Allow user to access route
    req.user = user;

    next();
})

exports.restrict = (...role) => {
    return asyncErrorHandler(async (req, res, next) => {
        if (!role.includes(req.user.role)) {
            const error = new CustomError('You don not have permission to perform this action', 403);
            next(error);
        }

        next();
    })
}

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {

    //1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        const error = new CustomError('We could not find the user with given email', 404);
        next(error);
    }

    //2. Generate a random reset token
    const resetToken = await user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    //3. Send the token back to the user email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `We have received a password reset request. Please use the below link to reset your password\n\n ${resetUrl}\n\n This reset password link will be valid only for 10 minutes`;

    try {

        await sendEmail({
            email: user.email,
            subject: 'Password Change Request',
            message: message
        });

        res.status(200).json({
            status: 'Success',
            message: 'Password reset link has been sent to the user'
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({ validateBeforeSave: false });
        return next(new CustomError('There was an error sending password reset email. Please try again later', 500));
    }

})

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    //1. if the user exists with the given token and the token is not expired
    const encryptedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: encryptedToken, passwordResetTokenExpires: { $gt: Date.now() } });

    if (!user) {
        const error = new CustomError('Token is invalid or expired', 404);
        return next(error);
    }

    //2. Change the password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    //3. login the user
    const token = signToken(user._id);

    createResponse(user, 200, token, res);

})



