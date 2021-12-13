
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
const uuid = require('uuid');
const { send } = require('process');
const fs = require('fs');
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

//set notice in req
app.post('/setnotice', (req, res) => {
    const notice = req.body.notice
    const request_id = req.body.request_id
    connection.execute('UPDATE requests SET notice = ?, status = 2 WHERE request_id = ?', [notice, request_id])
    .then(() => {
        
    })
})


// Set req status
app.post('/setstatusreq', (req, res) => {
    const request_id = req.body.request_id
    const status = req.body.status
    console.log(status)
    console.log(request_id)
       connection.execute('UPDATE requests SET status = ? WHERE request_id = ?', [status, request_id])
        .then(() => {
            res.status(200).send('Success').end()
        }) 
    



    

})

// Delete req with request_id
app.delete('/deletereq/:request_id', (req, res) => {
    const request_id = req.params.request_id

    try {
        connection.execute('SELECT img FROM requests WHERE request_id = ?', [request_id])
        .then(([result]) => {
            console.log(result[0].img)
            fs.unlink(`${__dirname}/../client/public/uploads/${result[0].img}`, () => {console.log("Delete")})
        })
    } catch (err) {

    }
    

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

    connection.execute('SELECT img FROM requests WHERE request_id = ?', [request_id])
        .then(([result]) => {
            console.log(result[0].img)
            fs.unlink(`${__dirname}/../client/public/uploads/${result[0].img}`, () => {console.log("Delete")})
        })

    

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
    
    var to = new Date()
    var x = to.getHours() + 7
    console.log(x)
    to.setHours(x)
    connection.execute('INSERT INTO requests (user_id , img , detail ,port ,title, createdate ) VALUES (?, ?, ? , ?, ? , ?)', [id , file.name ,detail , port, title , to])

    
    
})

//get all reqs
app.get('/getallreqs', (req, res) => {
    connection.execute('SELECT * FROM requests').then(([result]) => {
        console.log('Get all is done')
        
        res.status(200).json(result).end()
        

    })
})

//get all reqs with status 0
app.get('/getreqsstatus0', (req, res) => {
    connection.execute('SELECT * FROM requests where status = 0').then(([result]) => {
        console.log('Get all is done')
        
        res.status(200).json(result).end()
        

    })
})

//get all reqs with status 1
app.get('/getreqsstatus1', (req, res) => {
    connection.execute('SELECT * FROM requests where status = 1').then(([result]) => {
        console.log('Get all is done')
        
        res.status(200).json(result).end()
        

    })
})


//get all reqs with status 2
app.get('/getreqsstatus2', (req, res) => {
    connection.execute('SELECT * FROM requests where status = 2').then(([result]) => {
        console.log('Get all is done')
        
        res.status(200).json(result).end()
        

    })
})


//get all reqs with status 0 and 1
app.get('/getreqsstatus', (req, res) => {
    connection.execute('SELECT rq.* , us.code FROM requests as rq left join users as us on us.user_id = rq.user_id WHERE rq.status IN (  0 , 1 ) ').then(([result]) => {
        console.log('Get all is done')
        
        res.status(200).json(result).end()
        

    })
})



//get reqs by user ID
app.post('/getreqs', (req, res) => {
    const user_id = req.body.user_id
    if(user_id){
      connection.execute('SELECT * FROM requests WHERE user_id = ? ORDER BY request_id DESC', [user_id])
        .then(([result]) => {
            res.json(result)
            res.end
        })  
    } else {
        res.send('id not found')
    }
    
})

//get a req by req_ID
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
    body('username', 'invalid username 6 - 12 characters').trim().isLength({ min:6 , max:12}).custom((value) => {
        return connection.execute('SELECT username FROM users WHERE username = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                console.log('This username already exsit')
                
                return Promise.reject('This username already exsit')
            }
            return true
        })
    }),
    body('code', 'invalid code').trim().custom((value) => {
        return connection.execute('SELECT code FROM users WHERE code = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                return Promise.reject('This code already exsit')
            }
            return true
        })
    }),
    body('password', 'invalid password min 6 characters ').trim().isLength({ min : 6})
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
                // console.log(rows[0].password)
                // console.log(password)
                // console.log(compare_result)
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

//set user level
app.put('/setuserlevel', (req, res) => {
    const { user_id , level } = req.body
    connection.execute('UPDATE users SET level = ?  WHERE user_id = ?', [level , user_id])
    .then(() => {
        res.status(200).send('Success').end()
    })
})



//Gat all TA
app.get('/getallta', (req, res) => {
    connection.execute('SELECT * FROM users where level = 1').then(([result]) => {
        res.status(200).send(result).end()
    })
})

//Get all users
app.get('/getallusers', (req, res) => {
    connection.execute('SELECT * FROM users WHERE level != 2').then(([result]) => {
        
        res.status(200).send(result).end()
    })
})

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
    body('username', 'invalid username').trim().custom((value, {req}) => {

        return connection.execute('SELECT username FROM users WHERE username = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                if (rows[0].username != req.body.old_username) {
                    console.log('This username already exsit')
                    return Promise.reject('This username already exsit')
                }
                
            }
        
    })
    }),
    body('code', 'invalid code').trim().custom((value, {req}) => {

        return connection.execute('SELECT code FROM users WHERE code = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                if (rows[0].code != req.body.old_code) { 
                    console.log(rows[0].code)
                    console.log(req.body.old_code)
                    
                    console.log('This code already exsit')
                    return Promise.reject('This code already exsit')
                }
            }
            
        })
    }),
    body('email', 'invalid email').trim().custom((value, {req}) => {

        return connection.execute('SELECT email FROM users WHERE email = ?', [value])
        .then(([rows]) => {
            if (rows.length > 0) {
                if (rows[0].email != req.body.old_email) {
                    console.log('This email already exsit')
                    return Promise.reject('This email already exsit')
                }
            }
            
        })
        })
    ]
    ,(req, res) =>{
        console.log('Start')
        const user_id = req.params.user_id
        const username = req.body.username
        const firstname = req.body.firstname
        const lastname = req.body.lastname
        const email = req.body.email
        const subject = req.body.subject
        const code = req.body.code

        const validation_result = validationResult(req)
        console.log(validation_result.isEmpty())
       
        
        
        if ( validation_result.isEmpty() ) {

            connection.execute('UPDATE users SET username = ?, firstname = ?, lastname = ?, email = ? , subject = ? ,code = ? WHERE user_id = ?', [ username , firstname, lastname, email, subject, code , user_id])
            .then((result) => {
                
                console.log('End')
                res.status(200).send('Success to Edit').end()
                
            })

        } else {

                let allErrors = validation_result.errors.map((error) => {
                    return error.msg
                })
                return res.send(allErrors).end()
        
        }
            
    })

    // RESET user password by user_id
    app.put('/resetpassword/:user_id', (req, res) => {
        const user_id = req.params.user_id
        const old_password = req.body.old_password
        const new_password = req.body.new_password
        console.log(old_password) 
        console.log(new_password) 

        bcrypt.compare( new_password, old_password).then(compare_result => {
            console.log(compare_result)
            
            if(!compare_result){
                bcrypt.hash(new_password, 12).then((hash) => {

                    connection.execute('UPDATE users SET password = ? WHERE user_id = ?', 
                    [hash, user_id])
                    .then(() => {
                        console.log('Success')
                        return res.status(200).send('Success').end()
                    })

                })
                        

            } else {

                console.log('Do nothing')
                return res.status(200).send('Do nothing').end()
            }

        })

        
    })

    // Delete user by user_id
    app.delete('/deleteuser/:user_id', (req, res) => {
        const user_id = req.params.user_id
        connection.execute('DELETE FROM users WHERE user_id = ?', [user_id]).then(() => {
            res.status(200).send('Success').end()
        })

    })




////////////////////////////////////////////////NOTICES /////////////////////////////////////

//edit notice with img
app.post('/editnoticeimg/:notice_id', (req, res) => {

    if(req.files === null){
        return res.status(400).json({ msg: 'no file upload'})
    }

    const notice_id = req.params.notice_id

    connection.execute('SELECT img FROM notices WHERE notice_id = ?', [notice_id])
        .then(([result]) => {
            console.log(result[0].img)
            fs.unlink(`${__dirname}/../client/public/uploads/notice/${result[0].img}`, () => {console.log("Delete")})
        })

    const file = req.files.file
    const title = req.body.title
    const detail = req.body.detail
    
    file.name = uuid.v4()+".jpg"

    file.mv(`${__dirname}/../client/public/uploads/notice/${file.name}`, err => {
        if(err) {
            console.error(err)
            return res.status(500).send(err)
        }
        res.json({ fileName: file.name, filePath: `/uploads/notice/${file.name}`})
    })
    
    connection.execute('UPDATE notices SET img = ?, title = ?, detail = ? WHERE notice_id = ?',
        [file.name, title ,detail ,notice_id]).catch(err => {
         console.error(err)
         
     })

})

//edit notice without img
app.post('/editnotice/:notice_id', (req, res) => {
    const notice_id = req.params.notice_id
    const title = req.body.title
    const detail = req.body.detail
    connection.execute('UPDATE notices SET title = ?, detail = ? WHERE notice_id = ?', 
    [title, detail, notice_id]).then(() => {

        res.status(200).send({msg:'Success to Edit'}).end()
    }).catch((error) => {
        console.log(error)
    })

})


//get Notice by id
app.get('/getnotice/:notice_id', (req, res) => {
    const notice_id = req.params.notice_id
    connection.execute('SELECT * FROM notices WHERE notice_id = ?', [ notice_id])
    .then(([result]) => {
        res.status(200).json(result).end()
    })
})

//Get all Notices 
app.get('/getallnotices', (req, res) => {
    connection.execute('SELECT * FROM notices').then(([response]) => {
        return res.json(response)
    })
})

//create notice
app.post('/createnotice', (req, res) => {  

    if(req.files === null){
        return res.status(400).json({ msg: 'no file upload'})
    }
    const detail = req.body.detail
    const title = req.body.title
    const file = req.files.file

    file.name = uuid.v4()+".jpg"
    
    file.mv(`${__dirname}/../client/public/uploads/notice/${file.name}`, err => {
        if(err) {
            console.error(err)
            return res.status(500).send(err)
        }
        res.json({ fileName: file.name, filePath: `/uploads/notice/${file.name}`})
    })
    connection.execute('INSERT INTO notices (title , img , detail ) VALUES ( ?, ?, ?)',
     [title, file.name ,detail])
    
})

//delete notice by notice_id
app.delete('/deletenotice/:notice_id', (req, res) => {
    const notice_id = req.params.notice_id
    
    try {
            connection.execute('SELECT img FROM notices WHERE notice_id = ?', [notice_id])
                .then(([result]) => {
                    
                    fs.unlink(`${__dirname}/../client/public/uploads/notice/${result[0].img}`, () => {console.log("Delete")})
                })
    } catch (err) {

    }
    

    connection.execute('DELETE FROM notices WHERE notice_id = ?', [notice_id]).then(() => {
        res.status(200).send('Success').end()
    })


})

///////////////////////////////////////// ANSWER ////////////////////////////////////////////////////


//get answer by id
app.get('/getans/:id' , (req, res) => {
    const answer_id = req.params.id
    connection.execute('SELECT * FROM answers where answer_id = ?' , [answer_id]).then(([result]) => {
        res.status(200).send(result).end()
    })
    

})

//get all answers
app.get('/getallans' , (req, res) => {
    
    connection.execute('SELECT * FROM answers').then(([result]) => {
        res.status(200).send(result).end()
    })
    

})

// create answer
app.post('/createans' , (req, res) => {
    const answer_detail = req.body.detail
    const answer_title = req.body.title
    console.log(answer_detail)
    console.log(answer_title)
    if (answer_title == '' || answer_detail == '') {
        res.status(250).send("please type something").end();
    } else {

        connection.execute('Insert INTO answers (answer_detail, answer_title) VALUES (?,?)', 
        [answer_detail, answer_title ]).then(()=> {
            res.status(200).send("success").end();
        })

    }
})

//edit answer by id
app.post('/editans', (req, res) => {
    const answer_detail = req.body.answer_detail
    const answer_title = req.body.answer_title
    const answer_id = req.body.answer_id

        connection.execute('UPDATE answers SET answer_title = ? , answer_detail = ? WHERE answer_id = ?',
        [answer_title, answer_detail ,answer_id]).then(() => {

        res.send('Success') 
        return res.end
     })
    
})


// delete answer by id
app.get('/deleteans/:answer_id', (req, res) => {

    const answer_id = req.params.answer_id
    connection.execute('DELETE FROM answers WHERE answer_id = ?', [answer_id]).then(() => {
        res.status(200).send('Success').end()
    })
})

//////////////////////////////////////// SET DATETIME ////////////////////////////////////////////////////

// get Createdate in reqs by id
app.get('/createdatereq/:req_id', (req, res) => {

    try{
        const req_id = req.params.req_id
        
        connection.execute('select createdate from requests where request_id = ?', [req_id]).then(([result]) => {

            var stamp = JSON.stringify(result)
            var date = stamp.substring(26,16)
            var time = stamp.substring(35,27)
            var datetime = `${date}T${time}`
            
            console.log(result)
            
            
        


            res.status(200).send({date: date, time: time}).end()
    })

    }catch(err){
        console.log(err)
    }
    
})


// get timpstamp in reqs by id
app.get('/timestampreq/:req_id', (req, res) => {

    try{
        const req_id = req.params.req_id
        
        connection.execute('select timestamp from requests where request_id = ?', [req_id]).then(([result]) => {

            var stamp = JSON.stringify(result)
            var date = stamp.substring(25,15)
            var time = stamp.substring(34,26)
            var datetime = `${date}T${time}`
            //to.setHours(to.getHours())
            console.log(datetime)
            
            
        


            res.status(200).send({date: date, time: time}).end()
    })
    } catch (err) {

    }

    })
//////////////////////////////////////// subject  ////////////////////////////////////////////////////

//get all subjects
app.get('/subjects' , (req, res) => {

    connection.execute('SELECT * FROM subjects').then(([result]) => {
        res.status(200).send(result).end()
    })

})

//get subject by id
app.get('/subject/:id' , (req, res) => {
    const id = req.params.id
    connection.execute('SELECT * FROM subjects WHERE subject_id = ?' , [id]).then(([result]) => {
        res.status(200).send(result).end()
    })

})

//create subject
app.post('/createsub' , (req, res) => {

    const name = req.body.subject_name
    const code = req.body.subject_code

    if (name == '' || code == '') {
        res.status(250).send("please type something").end();
    } else {

        connection.execute('Insert INTO subjects (subject_name, subject_code) VALUES (?,?)', 
        [name, code ]).then(()=> {
            res.status(200).send("success").end();
        })
        
    }
    

})

//edit subject by id
app.post('/editsub/:subject_id' , (req, res) => {

    const name = req.body.subject_name
    const code = req.body.subject_code
    const id = req.params.subject_id

    

    connection.execute('UPDATE subjects SET subject_code = ? , subject_name = ? WHERE subject_id = ?', 
        [code, name , id ]).then(()=> {
            res.status(200).send("success").end();
        }
    )
        
    
    

})

// delete subject by id
app.get('/deletesub/:subject_id', (req, res) => {

    const id = req.params.subject_id
    connection.execute('DELETE FROM subjects WHERE subject_id = ?', [id]).then(() => {
        res.status(200).send('Success').end()
    })
})

//////////////////////////////////////// SERVER ////////////////////////////////////////////////////

app.listen(8000, () => {
    console.log('Running on port 8000......')
})


app.use('/', (req, res) => {
    res.status(404).send('<h1>404 page not found</h1>')
    
})
