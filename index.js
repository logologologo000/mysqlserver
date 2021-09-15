
const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt')
const connection = require('./database');
const { body, validatorResult, validationResult } = require('express-validator')

const sessions = require('express-session');
const bodyParser = require('body-parser');
const { response } = require('express');
const mysql = require('mysql');
const cors = require('cors')
const fileUpload = require('express-fileupload')
const uuid = require('uuid')
const app = express();


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}))
app.use(fileUpload())

// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'ejs')


app.use(cookieSession({ 
    name:'session',
    keys: ['key1','key2'],
    maxAge: 3600 * 1000
}))

///////////////////////////////////////////////// REQUESTS //////////////////////////////////////////

// Delete req with request_id
app.delete('/deletereq/:request_id', (req, res) => {
    const request_id = req.params.request_id
    connection.execute('DELETE FROM requests WHERE request_id = ?', [request_id])
    .then(() => {
        res.status(200).send('Delete Success')
    })
})



//Edit req
app.post('/editreq', (req, res) => {


    const detail = req.body.detail
    const port = req.body.port
    const title = req.body.title
    const request_id = req.body.request_id

    
        
        
        connection.execute('UPDATE requests SET title = ? , port = ?, detail = ? WHERE request_id = ?',
        [title, port ,detail ,request_id]).then(() => {

        res.send('Success')
        return res.end
     })
    
})

//Edit req with img
app.post('/editreqimg', (req, res) => {

    if(req.files === null){
        return res.status(400).json({ msg: 'no file upload'})
    }
    const file = req.files.file
    const title = req.body.title
    const detail = req.body.detail
    const port = req.body.port
    const request_id = req.body.request_id
    file.name = uuid.v4()+".jpg"
    

    file.mv(`${__dirname}/../client/public/uploads/${file.name}`, err => {
        if(err) {
            console.error(err)
            return res.status(500).send(err)
        }
        res.json({ fileName: file.name, filePath: `/uploads/${file.name}`})
    })
    
    connection.execute('UPDATE requests SET img = ?, title = ?, detail = ?, port = ? WHERE request_id = ?',
        [file.name, title,detail,port ,request_id]).catch(err => {
         console.error(err)
         
     })
    
})

//Create req 
app.post('/createreq', (req, res) => {
    

    if(req.files === null){
        return res.status(400).json({ msg: 'no file upload'})
    }
    const detail = req.body.detail
    const port = req.body.port
    const title = req.body.title
    const file = req.files.file
    
    const id = req.body.user_id
    file.name = uuid.v4()+".jpg"
    

    file.mv(`${__dirname}/../client/public/uploads/${file.name}`, err => {
        if(err) {
            console.error(err)
            return res.status(500).send(err)
        }
        res.json({ fileName: file.name, filePath: `/uploads/${file.name}`})
    })
    
    connection.execute('INSERT INTO requests (user_id , img , detail ,port ,title ) VALUES (?, ?, ? , ?, ?)', [id , file.name ,detail , port, title])
    
    
})


//get all reqs from user ID
app.post('/getreqs', (req, res) => {
    const user_id = req.body.user_id
    if(user_id){
      connection.execute('SELECT * FROM requests WHERE user_id = ?', [user_id])
        .then(([result]) => {
            res.json(result)
            res.end
        })  
    } else {
        res.send('id not found')
    }
    
})

//get a req from req_ID
app.post('/getreq', (req, res) => {
    const req_id = req.body.request_id
    if(req_id){
      connection.execute('SELECT * FROM requests WHERE request_id = ?', [req_id])
        .then(([result]) => {
            res.json(result[0])
        })  
    } else {
        res.send('id not found')
    }
    
})



///////////////////////////////////////////////////////////// USER ////////////////////////////////////////////////

//register
app.post('/register', [
    body('email', 'invalid Email address').trim().custom((value) => {
        if (!value) {
            return Promise.reject('This email is empty')

        }
        return connection.execute('SELECT email FROM users WHERE email = ?', [value])
        .then(([rows]) => {
            
            if (rows.length > 0) {
                return Promise.reject('This email already exsit')
            }
            return true
        })
    }),
    body('username', 'invalid username').trim().custom((value) => {
        return connection.execute('SELECT username FROM users WHERE username = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                console.log('This username already exsit')
                
                return Promise.reject('This username already exsit')
            }
            return true
        })
    }),
    body('code', 'invalid username').trim().custom((value) => {
        return connection.execute('SELECT code FROM users WHERE code = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                return Promise.reject('This code already exsit')
            }
            return true
        })
    }),
    body('password', 'invalid password').trim().isLength({ min : 6})
], (req, res, next) => {
    const validation_result = validationResult(req)
    const { username, email ,password, code , firstname, lastname , subject } = req.body
    //if none of err
    if (validation_result.isEmpty()) {
        bcrypt.hash(password, 12).then((hash) => {
            connection.execute('INSERT INTO users (username , password  , email , code , firstname, lastname , subject) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [username, hash , email ,code , firstname, lastname , subject])
            .then(result => {
                console.log(result)
                res.send(`Success to add ${username} ${email} ${code} ${firstname} ${lastname}`)
            }).catch(err => {
                if (err) {
                    throw err
                }
            })
        }).catch(err => {
            if (err) {
                throw err
            }
        })
    //if some err    
    } else {
        let allErrors = validation_result.errors.map(error => {
            return error.msg
        })

        res.send({
            register_error: allErrors,
            old_data: req.body
        })
    }
})




// login

app.post('/login', [
    body('username').custom((value) => {
        if (value) {
            return connection.execute('SELECT username FROM users WHERE username = ?', [value])
            .then(([rows]) => {
                if (rows.length == 1) {
                    return true
                }
                
                return Promise.reject('Invalid email address')
            }) 
        } else {
            return Promise.reject('email is empty')
        }
        
    }),
    body('user_password','password is empty').trim()

], (req, res) => {
    const validation_result = validationResult(req)
    const { username, password } = req.body
    
    if ( validation_result.isEmpty() ) {
        
        connection.execute('SELECT * FROM users WHERE username = ? ', [ username ])
        .then(([rows]) => {
            
            bcrypt.compare(password, rows[0].password).then(compare_result => {
                
                if (compare_result === true) {
                    
                    req.session.isLoggedIn = true;
                    req.session.id = rows[0].id
                    req.session.status = rows[0].level
                    res.json(rows)
                } else {
                    res.send({ 
                        login_errors: ['invalid Password'],
                        server_password: rows[0].password,
                        your_password: password
                    })
                }
            }).catch(error => {
                if (error) throw error
            })
        }).catch(error => {
            if (error) throw error
        })
    } else {
        let allErrors = validation_result.errors.map((error) => {
            return error.msg
        })
        res.send({
            login_errors: allErrors
        })
    }

} )


//logout
app.get('/logout', (req, res) => {

    //session destroy
    req.session = null
    res.redirect('/')
})

///////////////////////////////////////// USERS //////////////////////////////////////////

// Get user by user_id
app.get('/getuser/:user_id', (req, res) => {
    console.log('Start')
    const user_id = req.params.user_id
    
        connection.execute('SELECT * FROM users WHERE user_id = ?', [ user_id])
        .then(([result]) => {
            console.log(result)
            console.log('End')
            res.status(200).json(result).end()
        })
    }
)

//Edit user by user_id
app.post('/edituser/:user_id', [
    body('username', 'invalid username').trim().custom((value) => {

    return connection.execute('SELECT username FROM users WHERE username = ?', [value])
    .then(([rows]) => {
        if (rows.length > 0) {
            console.log('This username already exsit')
            return Promise.reject('This username already exsit')
        }
        
    })
    })] 
    ,(req, res) =>{
        console.log('Start')
        const user_id = req.params.user_id
        const old_username = req.body.old_username
        const username = req.body.username
        const firstname = req.body.firstname
        const lastname = req.body.lastname
        const email = req.body.email
        const subject = req.body.subject
        const code = req.body.code

        console.log({
        old_username,
        username,
        firstname,
        lastname,
        email,
        subject,
        code
        })

        const validation_result = validationResult(req)
        console.log(validation_result.isEmpty())
        
        
        if ( validation_result.isEmpty() ) {

            connection.execute('UPDATE users SET username = ?, firstname = ?, lastname = ?, email = ? , subject = ? ,code = ? WHERE user_id = ?', [ username , firstname, lastname, email, subject, code , user_id])
            .then((result) => {
                
                console.log('End')
                res.status(200).send('Success to Edit').end()
                
            })

        } else {

        console.log(req.body.username == old_username)
            if (req.body.username == old_username) {
                
                connection.execute('UPDATE users SET username = ?, firstname = ?, lastname = ?, email = ? , subject = ? ,code = ? WHERE user_id = ?', [ username , firstname, lastname, email, subject, code , user_id])
                .then((result) => {
                    
                    console.log('End')
                    
                    res.status(200).send('Success to Edit').end()
                })


            } else {
                        
                        let allErrors = validation_result.errors.map((error) => {
                            return error.msg
                        })
                        return res.send({
                            process_errors: allErrors
                        })

            }

            
        }
            
    })




//////////////////////////////////////// SERVER ////////////////////////////////////////////////////

app.listen(8000, () => {
    console.log('Running on port 8000......')
})


app.use('/', (req, res) => {
    res.status(404).send('<h1>404 page not found</h1>')
    
})
