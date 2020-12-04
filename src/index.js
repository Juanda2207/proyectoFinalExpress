const express = require ('express');
const path = require('path');
const cors = require('cors');
const app= new express();
const env = require('dotenv').config()

//INICIO DE SESION CON FACEBOOK
const passport = require('passport');
const session = require('express-session');
const { Strategy } = require('passport');
const facebookStrategy = require('passport-facebook').Strategy

app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200,
    methods: 'GET, PUT, DELETE, POST'
}))

app.set('port', process.env.PORT || 3000)

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));


//INICIO DE SESION CON FACEBOOK

app.use(passport.initialize());
app.use(passport.session());
app.use(session({secret:"thisissecretkey"}));

//FB STRATEGY

passport.use(new facebookStrategy({
    clientID:"418342149548932",
    clientSecret:"47dd6aa664d082e6f889f87586b1f1a1",
    callbackURL:"https://centromedicofuchicovid.herokuapp.com/facebook/callback",
    profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)', 'email']
}, function(token, refreshToken, profile, done){
    console.log(profile);
    return done(null, profile);
}));

app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));
app.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/failed'
}))

app.get('/profile', (req, res)=>{
    res.send('Usuario valido');
})

app.get('failed', (req, res)=>{
    res.send('No eres usuario valido');
})

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
   return done(null, id);
});

//routers
app.use(require('./routers/index'));

app.listen(app.get('port'),()=>{
    console.log('Server on port 3000');
})