const express = require('express');
const app = express();
const port = 3000;
const { MongoClient } = require('mongodb');
const winston = require('winston');
const bodyParser = require('body-parser');
require('dotenv').config();
// Winston 로그 설정
const logOptions = {
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}] ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(), // 콘솔 출력
        new winston.transports.File({ filename: 'app.log' }) // 파일로 저장
    ]
};

const logger = winston.createLogger(logOptions);

// Console에 모든 로그 출력을 추가
console.log = (...args) => {
    logger.info(args.join(' '));
    // 원래 console.log를 유지하려면 아래 주석을 해제하세요.
    // originalConsoleLog(...args);
};

app.set('view engine', 'ejs');
app.use('/public', express.static('public/css'));
app.use('/yu', express.static('views/public/css'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    logger.info(`접속한 IP 주소: ${clientIp}`);
    next();
});

const url = process.env.MONGODB_URI;

let db;

(async () => {
    try {
        const client = await MongoClient.connect(url);
        logger.info('DB 연결 성공');
        db = client.db('forum');
        
        app.listen(port, () => {
            logger.info(`http://localhost:${port} 에서 서버 실행 중`);
        });
    } catch (err) {
        logger.error('DB 연결 실패', err);
    }
})();

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html");
});

app.get('/list', async (req, res) => {
    try {
        const result = await db.collection('post').find().toArray();
        logger.info('데이터베이스에서 목록을 성공적으로 가져옴');
        res.render('list.ejs', { 글목록: result });
    } catch (err) {
        logger.error('데이터베이스에서 목록을 가져오는 중 오류 발생', err);
        res.status(500).send('서버 오류');
    }
});
app.get('/write',(req,res) =>{
  res.render('write.ejs')
})
app.get('/write/error',(req,res) =>{
    res.render('error.ejs')
  })
  app.get('/server/error',(req,res) =>{
    res.render('server_error.ejs')
  })
app.post('/add',async (요청,응답) =>{
    try {
        if (요청.body.title == '') {
            return 응답.redirect('/write/error');
          } if (요청.body.title == ' ') {
            return 응답.redirect('/write/error');
          } else  {
            await db.collection('post').insertOne({ title : 요청.body.title, content : 요청.body.content })
            응답.redirect('/list') 
          }
     } catch (e) {
        console.log(e)
        응답.status(500).redirect('/server/error')
     } 
  
})
app.get('/detail/:aaaa',(요청,응답)=>{
    응답.render("detail.ejs")
})