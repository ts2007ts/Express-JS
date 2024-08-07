const dotenv = require('dotenv')
dotenv.config({ path: './config.env' });

//Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(err.name, '   ', err.message);
    console.log('uncaught Exception occurred Shutting down..');

    process.exit(1);

});

const app = require('./app');
const { mongoConnection } = require('./utils/mongConnection');
const PORT = process.env.PORT || 5000;



//Connect to data base
mongoConnection;

// console.log(process.env);

//Create server 
const server = app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});

//Handle Rejection promises any where
process.on('rejectionHandled', (err) => {
    console.log(err.name, '   ', err.message);
    console.log('Unhandled rejection occurred Shutting down..');
    server.close(() => {
        process.exit(1);
    });
});

