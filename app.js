const express = require('express')
const ejs = require('ejs')
const app = express()
const port = 3000
var bodyParser = require('body-parser')
var session = require('express-session')

require('dotenv').config()

var today = new Date();

const mysql = require('mysql')
const connection = mysql.createConnection(process.env.DATABASE_URL)
console.log('Connected to PlanetScale!')

connection.query("Set time_zone = 'Asia/Seoul'")

app.set('view engine', 'ejs')
app.set('views', './views')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'))

// Use the session middleware
app.use(session({ secret: 'codecuresecrete', cookie: { maxAge: 60000 }, resave:true, saveUninitialized:true}))

app.use((req, res, next) => {


  res.locals.user_id = "";
  res.locals.name = "";
  res.locals.last_day ="";
  res.locals.locker_pw = "";

  if(req.session.member){
    res.locals.user_id = req.session.member.user_id
    res.locals.name = req.session.member.name

    var targetDate = new Date(req.session.member.last_day);
    var timeDiff = targetDate.getTime() - today.getTime();
    var daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    res.locals.last_day = daysRemaining
    res.locals.locker_pw = req.session.member.locker_pw
  }
  next()
})


//라우팅
app.get('/', (req, res) => {

  console.log(req.session.member)

  res.render('index') // ./views/index.ejs
})

app.get('/profile', (req, res) => {
    res.render('profile')
  })

app.get('/profile2', (req, res) => {
  res.render('profile2')
})

app.get('/map', (req, res) => {
    res.render('map')
  })

app.get('/contact', (req, res) => {
    res.render('contact')
  })

app.get('/noti', (req, res) => {
  res.render('noti')
})

app.get('/introduce', (req, res) => {
  res.render('introduce')
})

app.get('/mathod', (req, res) => {
  res.render('mathod')
})

app.get('/mypage', (req, res) => {
  // 현재 세션에 사용자 정보가 있는지 확인
  if (!req.session.member) {
      res.redirect('/login'); // 로그인되어 있지 않으면 로그인 페이지로 이동
      return;
  }

  const user_id = req.session.member.user_id;

  // 사용자의 locker_pw 값을 조회하는 SQL 쿼리
  const sql = 'SELECT locker_pw FROM member WHERE user_id = ?';
  const values = [user_id];

  connection.query(sql, values, (err, results, fields) => {
      if (err) throw err;

      // 조회된 결과가 있다면 locker_pw 값을 가져옴
      const locker_pw = results.length > 0 ? results[0].locker_pw : '';

      // mypage.ejs 파일로 locker_pw 값을 전달하여 렌더링
      res.render('mypage', { locker_pw });
  });
});

app.get('/payment', (req, res) => {
  // 현재 세션에 사용자 정보가 있는지 확인
  if (!req.session.member) {
      // 로그인되어 있지 않으면 클라이언트에게 알림을 보여주고 로그인 페이지로 이동
      res.send('<script>alert("로그인이 필요합니다."); window.location.href="/login";</script>');
      return;
  }

  res.render('payment'); // 로그인된 경우에만 payment 페이지를 렌더링
});


app.get('/locker', (req, res) => {
  res.render('locker')
})

app.post('/contactProc', (req, res) => {
    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const memo = req.body.memo;

    var sql = `insert into contact(name,phone,email,memo,regdate)
    values(?,?,?,?, now() )`

    var values = [name, phone, email, memo]
    
    connection.query(sql, values, function (err, result){
      if(err) throw err;
      console.log('자료 1개를 삽입하였습니다.');
      res.send("<script> alert('문의사항이 등록되었습니다'); location.href='/'; </script>");
    })

  })

  app.get('/contactDelete', (req, res) => {
    var idx = req.query.idx
    var sql = `delete from contact where idx='${idx}' `

    connection.query(sql, function (err, result){
      if(err) throw err;
      console.log('자료 1개를 삽입하였습니다.');
      res.send("<script> alert('삭제되었습니다.'); location.href='/contactList'; </script>");
    })

  })

  app.get('/contactList', (req, res) => {

    var sql = `select * from contact order by idx desc`
    connection.query(sql, function(err, results, fields){
      if(err) throw err;
      res.render('contactList',{lists:results})
    })

  })

// ----------------
  app.post('/notiProc', (req, res) => {
    const username = req.body.username;
    const memo = req.body.memo;

    var sql = `insert into noti(username,memo,regdate)
    values(?,?, now() )`

    var values = [username, memo]
    
    connection.query(sql, values, function (err, result){
      if(err) throw err;
      console.log('자료 1개를 삽입하였습니다.');
      res.send("<script> alert('문의사항이 등록되었습니다'); location.href='/notiList'; </script>");
    })

  })

  app.get('/notiDelete', (req, res) => {
    var idx = req.query.idx
    var sql = `delete from noti where idx='${idx}' `

    connection.query(sql, function (err, result){
      if(err) throw err;
      console.log('자료 1개를 삽입하였습니다.');
      res.send("<script> alert('삭제되었습니다.'); location.href='/notiList'; </script>");
    })

  })

  app.get('/notiList', (req, res) => {

    var sql = `select * from noti order by idx desc`
    connection.query(sql, function(err, results, fields){
      if(err) throw err;
      res.render('notiList',{lists:results})
    })

  })

  app.post('/lockerProc', (req, res) => {
    const locker_pw = req.body.locker_pw;
    const user_id = res.locals.user_id; // 사용자 아이디를 얻음

    // 아래의 SQL 문은 예시일 뿐, 실제 테이블과 컬럼명에 맞게 수정해야 합니다.
    var sql = `UPDATE member SET locker_pw = ? WHERE user_id = ?`;

    var values = [locker_pw, user_id];

    connection.query(sql, values, function (err, result) {
        if (err) throw err;
        console.log(locker_pw, user_id);
        console.log('비밀번호 등록 완료');
        res.send("<script> alert('비밀번호가 등록되었습니다'); window.opener.location.reload(true); window.close(); </script>");
    });
});

app.post('/paymentProc', (req, res) => {
  res.send("<script> alert('결제 되었습니다. 관리자의 승인 이후 남은 시간에 반영됩니다.'); location.href='/'; </script>");
});

app.post('/lockdel', (req, res) => {
  const locker_pw = null;
  const user_id = res.locals.user_id; // 사용자 아이디를 얻음

  // 아래의 SQL 문은 예시일 뿐, 실제 테이블과 컬럼명에 맞게 수정해야 합니다.
  var sql = `UPDATE member SET locker_pw = ? WHERE user_id = ?`;

  var values = [locker_pw, user_id];

  connection.query(sql, values, function (err, result) {
    if (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    console.log(locker_pw, user_id);
    console.log('비밀번호 삭제 완료');
    res.json({ success: true });
  });
});

  app.get('/login', (req, res) => {
    res.render('login')
  })

  app.post('/loginProc', (req, res) => {
    const user_id = req.body.user_id;
    const pw = req.body.pw;

    var sql = `select * from member where user_id=? and pw=?`

    var values = [user_id, pw];
    
    connection.query(sql, values, function (err, result){
      if(err) throw err;

      if (result.length==0){

        res.send("<script> alert('존재하지 않는 아이디입니다..'); location.href='/login'; </script>");
      }else{
        console.log(result);

        req.session.member = result[0]
        
        res.send("<script> alert('로그인 되었습니다.'); location.href='/'</script>")
        //res.send(result);
      }
    })

  })

// 사용자 등록 시 이미 존재하는 아이디인지 확인 후 저장
app.post('/registerProc', (req, res) => {
  const name = req.body.name;
  const user_id = req.body.user_id;
  const pw = req.body.pw;

  // 이미 존재하는 아이디인지 확인
  var checkUserSql = 'SELECT * FROM member WHERE user_id=?';
  var checkUserValues = [user_id];

  connection.query(checkUserSql, checkUserValues, (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
          // 이미 존재하는 아이디인 경우
          res.send("<script> alert('이미 존재하는 아이디입니다.'); location.href='/register'; </script>");
      } else {
          // 존재하지 않는 아이디인 경우, 새로운 사용자 등록
          var insertUserSql = 'INSERT INTO member (name, user_id, pw) VALUES (?, ?, ?)';
          var insertUserValues = [name, user_id, pw];

          connection.query(insertUserSql, insertUserValues, (err, result) => {
              if (err) throw err;
              console.log('User registered successfully');
              res.send("<script> alert('회원가입이 완료되었습니다.'); location.href='/login'; </script>");
          });
      }
  });
});

app.get('/register', (req, res) => {
  res.render('register')
})

  app.get('/logout', (req, res) => {

        req.session.member = null;
        
        res.send("<script> alert('로그아웃 되었습니다.'); location.href='/'</script>")
      }
)

app.listen(port, () => {
  console.log(`서버가 실행되었습니다. 접속주소: localhost:${port}`)
})