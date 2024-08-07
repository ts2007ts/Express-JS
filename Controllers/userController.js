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

const filterReqObject = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(prop => {
        if (allowedFields.includes(prop))
            newObj[prop] = obj[prop];
    })
    return newObj;
}


exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    //1. Get current user data from database
    const user = await User.findById(req.user._id).select('+password');


    //2. Check if the supplied current password is correct
    if (!(await user.comparePasswords(req.body.currentPassword, user.password))) {
        return next(new CustomError('Password you provided is wrong!', 401));
    }

    //3. is correct , update user password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    //4. login the user and send jwt 
    const token = signToken(user._id);
    const id = user._id;
    const email = user.email;

    res.status(200).json({
        status: "success",
        data: {
            token,
            id,
            email,
        }
    })
})

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
    //1. Check if the request data contain password | confirm password
    if (req.body.password || req.body.confirmPassword) {
        return next(new CustomError('You can not update your password using this endpoint', 400));
    }

    //2. Update user details
    const filterObj = filterReqObject(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObj, { runValidators: true, new: true });

    res.status(200).json({
        status: "success",
        data: {
            updatedUser
        }
    })
})

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: "success",
        data: {
            message: "Deleted Successfully"
        }
    });
})

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        length: users.length,
        data: {
            users
        }
    })
})
