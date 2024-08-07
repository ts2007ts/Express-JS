const mongoose = require('mongoose')

//Connect to data base
const connect = mongoose.connect(process.env.LOCAL_CONN_STR)
    .then((conn) => {
        // console.log(conn);
        console.log('DB Connection Successful');
    }).catch((error) => {
        console.log(error);
    })


module.exports = connect