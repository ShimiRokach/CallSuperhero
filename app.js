const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const Hero = require('./models/hero');
const Call = require('./models/call');
const User = require('./models/user');
const session = require('express-session');  // session middleware
const passport = require('passport');  // authentication
const LocalStrategy = require('passport-local');


mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/heroes', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.set('view engine', 'ejs');

//parse the request body
app.use(express.urlencoded({ extended: true }));
//override post
app.use(methodOverride('_method'));

app.use(session({
    secret: 'r8q,+&1LM3)CD*zAGpx1xm{NeQhc;#',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

const validateLogin = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.render('users/login');
}

const specialties = ["STOP ALIEN'S INVASION", "FIGHT AGAINST TERRORISM", "FIGHT AGAINST DARK WIZARDS", "HEAL SICK PEOPLE"];

app.get('/', validateLogin, (req, res) => {
    res.render('home');
});

app.get('/heroes/create', validateLogin, (req, res) => {
    res.render('heroes/create', { specialties });
});

app.get('/heroes', validateLogin, async (req, res, next) => {
    try {
        const heroes = await Hero.find({ creator: req.user._id });
        res.render('heroes/showAll', { heroes });
    }
    catch (e) { next(e); }
});

app.get('/heroes/:id', validateLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const hero = await Hero.findById(id);
        res.render('heroes/show', { hero });
    }
    catch (e) { next(e); }
});

app.get('/heroes/:id/edit', validateLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const existHero = await Hero.findById(id);
        res.render('heroes/edit', { existHero, specialties });
    }
    catch (e) { next(e); }
});

app.get('/heroes/:id/delete', validateLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const existHero = await Hero.findById(id);
        res.render('heroes/delete', { existHero });
    }
    catch (e) { next(e); }
});

app.post('/heroes/create', validateLogin, async (req, res, next) => {
    try {
        if (!req.body.hero.turn) {
            req.body.hero.turn = 'OFF';
        }
        const newHero = new Hero(req.body.hero);
        newHero.creator = req.user._id;
        await newHero.save();
        res.redirect(`/heroes/${newHero._id}`);
    }
    catch (e) {
        next(e);
    }
});

app.put("/heroes/:id", validateLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.body.hero.turn) {
            req.body.hero.turn = 'OFF';
        }
        console.log(req.body.hero);
        const updatedHero = await Hero.findByIdAndUpdate(id, req.body.hero, { runValidators: true, new: true });
        res.redirect(`/heroes/${updatedHero._id}`);
    }
    catch (e) {
        next(e);
    }
});

app.delete("/heroes/:id", validateLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        await Hero.findByIdAndDelete(id);
        res.redirect('/heroes');
    }
    catch (e) {
        next(e);
    }
});

app.get('/calls/preCreate', validateLogin, (req, res, next) => {
    res.render('calls/preCreate');
});

app.get('/calls', validateLogin, async (req, res, next) => {
    try {
        const calls = await Call.find({ creator: req.user._id }).populate('hero');
        res.render('calls/showAll', { calls });
    }
    catch (e) {
        next(e);
    }
});

app.get('/calls/:id', validateLogin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const newCall = await Call.findById(id).populate('hero');
        res.render('calls/show', { newCall });
    }
    catch (e) {
        next(e);
    }
});

app.get('/calls/:id/edit', validateLogin, (req, res) => {
    res.send('here you will edit the help you asked')
});

app.post('/calls/preCreate', validateLogin, async (req, res, next) => {
    try {
        const { category } = req.body;
        const heroes = await Hero.find({ specialty: category, creator: req.user._id });
        res.render('calls/create', { category, heroes });
    }
    catch (e) {
        next(e);
    }
});

app.post('/calls/create', validateLogin, async (req, res, next) => {
    try {
        const existHero = await Hero.findById(req.body.call.hero);
        const newCall = new Call(req.body.call);
        newCall.creator = req.user._id;
        existHero.calls.push(newCall);
        await existHero.save();
        await newCall.save();

        res.redirect(`/calls/${newCall._id}`);
    }
    catch (e) {
        next(e);
    }
});

app.get('/users/register', (req, res) => {
    res.render('users/register');
});

app.get('/users/login', (req, res) => {
    res.render('users/login');
});

app.post('/users/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body.user;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.render('home');
        })
    }
    catch (e) {
        next(e);
    }
});

app.post('/users/login', passport.authenticate('local', { failureRedirect: '/users/login' }), (req, res) => {
    res.render('home');
})

app.get('/users/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})