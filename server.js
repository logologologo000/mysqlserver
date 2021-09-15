let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let mysql = require('mysql');
let port = 8080

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

///home route
app.get('/', (req, res) => {
    return res.send({
        error : false,
        massage : 'welcome',
        written_bye : 'Pannawitt',
        published_on : 'https://google.com',
    })
})


// connection to mysql database
let dbCon = mysql.createConnection({
    host : 'localhost',
    user: 'root',
    password : '',
    database : 'nodejs_api'
})
dbCon.connect()

//retrive all books
app.get('/books', (req, res) => {
    dbCon.query('SELECT * FROM books', (error, results, fields) => {
        if (error) { 
            throw  error;
        }
        let massage = ""
        if (results === undefined || results == 0) {
            massage = "book table is empty";
        } else {
            massage = "Successfully retrived all books";            
        }

        return res.send({
            error: false,
            data: results,
            messages: massage,

        })

    })
})

// add book
app.post('/book', (req, res,) => {
    let name = req.body.name;
    let author = req.body.author;

    if (!name || !author ) {
        return res.status(400).send({ 
            error: true,
            massage: "Please provide book name and author"
        })
    } else {
        dbCon.query('INSERT INTO books (name, author) VALUES(?,?)', [ name , author], (error, results, fields) => {
                if (error) throw error;
                return res.send({ 
                    error :false,
                    data: results,
                    massage: "Successfully added"
                })
        } )
    }
})

//get id from book 
app.get('/books/:id', (req, res) => {
    let id = req.params.id

    if (!id) {
        return res.status(400).send({
            error : true,
            massage : "Please provide a valid"
        })
    } else {
        dbCon.query('SELECT * FROM books WHERE id = ?', [id] , (error, results, fields) => {

            if (error) throw  error;
            let massage =""
            if (results === undefined || results.length == 0) {
                message = "book not found"
            } else {
                message = "Successfully retrived book data"
            }

            return res.send({ 
                error : false,
                data: results[0],
                message : massage 
            })
        })
    }
})

//update book by id
app.put('/book', (req, res) => {
    let id = req.body.id;
    let name = req.body.name;
    let author = req.body.author;

    // validation 
    if (!id || !name || !author) {
        return res.status(400).send({
            error : true,
            massage : "Please provide"
        })
    } else {
        dbCon.query('UPDATE books SET  name = ?, author = ?  WHERE id = ?',
        [name , author , id],
        (error, results, fields) => {
            if (error) throw  error;

            let massage = ""
            if (results.changedRows === 0) {
                massage = "book not found or data are same"
            } else {
                massage = "Book successfully update"
            }

            return res.send({
                error: false,
                data: results,
                massage: massage
            })
        })
    }

})


//delete book 
app.delete('/book', (req, res) => {
    let id = req.body.id;

    if (!id) {
        return res.status(400).send({
            error : true,
            message: "Please provide"
        })
    } else { 
        dbCon.query('DELETE FROM books WHERE id = ?',
        [id], (error, results, fields) => {
            if (error) throw  error;
            let massage = ""
            if (results.affectedRows === 0) {
                massage = "book not found"
            } else {
                massage = "Book successfully delete"
            }
            return res.send({
                error : false,
                date: results,
                massage: massage
            })
        })
    }
})

//set port
app.listen(port, (req, res) => {
    console.log(`Node app is Running on port ${port}...`)
})