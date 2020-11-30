const express = require ('express');
const path = require('path');
const cors = require('cors');
const app= new express();
const env = require('dotenv').config()

app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200,
    methods: 'GET, PUT, DELETE, POST'
}))

app.set('port', process.env.PORT || 3000)

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));
//app.use(express.static(path.join(__dirname, 'public')));

//routers
app.use(require('./routers/index'));

app.listen(app.get('port'),()=>{
    console.log('Server on port 3000');
})