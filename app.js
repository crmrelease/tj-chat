const express = require('express')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const session = require('express-session')
const path = require('path')
const flash = require('connect-flash')
const ColorHash = require('color-hash');
require('dotenv').config();

const connect = require('./schemas')


const webSocket = require('./socket')
const indexRouter = require('./routes')

const app = express();
connect();

const sessionMiddleware = session({
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    }
    })


app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
app.set('port',process.env.PORT||6001);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'public')));
app.use('/gif',express.static(path.join(__dirname,'uploads')));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
//socket.js에서도 세션을 쓰기 위해 변수로 빼자
app.use(flash());

app.use((req,res,next)=>{
    if(!req.session.color){
        const colorHash = new ColorHash();
        req.session.color = colorHash.hex(req.sessionID)
    }
    next()
})
//입장하는 사람에게 랜덤으로 컬러 매겨주기

app.use('/',indexRouter);

app.use((req,res,next)=>{
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
})

app.use((req,res,next)=>{
    res.locals.message = err.message;
    res.locals.error = req.app.get('env')==='development'? err:{};
    res.status(err.status||500);
    res.render('error')
})

const server = app.listen(app.get('port'),(req,res,next)=>{
    console.log(`${app.get('port')} 번에서 가져오고 있슴다.`);
})

webSocket(server,app,sessionMiddleware);
//app을 넘겨주자