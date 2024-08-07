const Movie = require('../Models/movieModel');
const asyncErrorHandler = require('../Error/asyncErrorHandler');
const CustomError = require('../Error/CustomError');
const APIFeatures = require('./../Utils/APIFeatures');



exports.getHighestRating = (req, res, next) => {

    req.query.limit = '5';
    req.query.sort = '-ratings';

    next();
}


exports.getAllMovies = asyncErrorHandler(async (req, res, next) => {

    const features = new APIFeatures(Movie.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    let movies = await features.query;

    res.status(200).json({
        status: "success",
        length: movies.length,
        data: {
            movies
        }
    })
})

//GET Create /api/v1/movies/:id
//api/movies
exports.getMovie = asyncErrorHandler(async (req, res, next) => {

    // const movie = await Movie.find({ _id: req.params.id });
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
        const error = new CustomError('Movie with that ID is not found', 404);
        return next(error);
    }
    res.status(200).json({
        status: "success",
        data: {
            movie
        }
    })
})

//POST  /api/v1/movies
exports.createMovie = asyncErrorHandler(async (req, res, next) => {

    const movie = await Movie.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            movie
        }
    })


})

//PATCH /api/v1/movies/:id
exports.updateMovie = asyncErrorHandler(async (req, res, next) => {

    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!movie) {
        const error = new CustomError('Movie with that ID is not found', 404);
        return next(error);
    }

    res.status(200).json({
        status: "success",
        data: {
            movie
        }
    })

})

//DELETE /api/v1/movies/:id
exports.deleteMovie = asyncErrorHandler(async (req, res, next) => {

    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
        const error = new CustomError('Movie with that ID is not found', 404);
        return next(error);
    }

    res.status(204).json({
        status: "success",
        data: null
    })

})

// app.get('/api/v1/movies', getAllMovies);
// app.get('/api/v1/movies/:id', getMovie);
// app.post('/api/v1/movies', createMovie);
// app.patch('/api/v1/movies/:id', updateMovie);
// app.delete('/api/v1/movies/:id', deleteMovie);


