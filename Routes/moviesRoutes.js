const express = require('express');
const moviesController = require('./../Controllers/moviesController');
const authController = require('./../Controllers/authController');


const router = express.Router();

// router.param('id', moviesController.checkId);

router.route('/highest-rated')
    .get(moviesController.getHighestRating, moviesController.getAllMovies)

router.route('/')
    .get(authController.protect, moviesController.getAllMovies)
    .post(moviesController.createMovie);

router.route('/:id')
    .get(moviesController.getMovie)
    .patch(moviesController.updateMovie)
    .delete(authController.protect, authController.restrict('admin'), moviesController.deleteMovie);


// const defaultRouter = (req, res, next) => {
//     res.status(404).json({
//         status: 'Failed',
//         message: `Can't find ${req.originalUrl} on the server`
//     })
// }


module.exports = router;