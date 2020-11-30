var express = require('express'),
app = express(),
session = require('express-session');
const nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
const sha256 = require('sha256')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'string-supersecreto-nuncavisto-jamas',
    name: 'sessionId',
    proxy: true,
    resave: true,
    saveUninitialized: true ,
    cookie: { maxAge:  60 * 60 * 1000 }  
}));
const path = require('path');
app.use('/public', express.static(path.join(__dirname + '/public')));

nunjucks.configure(path.join(__dirname + '/views/'), {
    autoescape: false,
    express: app
});

require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = process.env.url;

app.all("/", (req, res) => {

    if (!req.body.user || !req.body.pass) {
        res.status(200).render('index.html');   
    } 
    else {
    
        MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
            const dbo = db.db("libreria");  
            
            dbo.collection("user").findOne({$and:[{"user":req.body.user},{"password":(sha256(req.body.pass))}]},function(err, usuario) {             
             
                if(usuario){
                    req.session.login = true;  
                    req.session.nombre = usuario.user;
                    req.session.admin = usuario.admin;
                    req.session.level = usuario.level
                    res.status(200).render('index.html',{logeado:req.session.login, admin:req.session.admin, user:req.session.nombre, level:req.session.level});
                }
                else{
                    res.status(401).render('nouser.html');
                } 
            })
        });
    }
    });


app.get('/logout', function (req, res) {
    req.session.destroy();
    res.render('logout.html', )
});

app.all('/addAdmin', (req, res)=>{
if(!req.session.login){res.status(200).render('index.html');}
else{
if (!req.body.user){
    res.status(200).render('addAdmin.html',{logeado:req.session.login, admin:req.session.admin, user:req.session.nombre, level:req.session.level})   
}
else{
    var addU = true
    MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
        const dbo = db.db("libreria")
        dbo.collection("user").insertOne(
            {   
                user: req.body.user,
                password: (sha256(req.body.pass)),
                admin: true,
                level: parseFloat(req.body.level),
            },
            function (err, res) {
                if (err) {
                db.close();
                return console.log(err);
                }
                db.close()
            })
            res.status(200).render('addAdmin.html',{addU:addU, userNew:req.body.user,user:req.session.nombre})
        })
    }
}});

app.all('/add', (req, res)=>{
if(!req.session.login){res.status(200).render('index.html');}
else{
    if(!req.body.isbn){
    var fecha = new Date()
    var y = fecha.getUTCFullYear()
    var d = fecha.getDate()
	var d1 = ''
    var m = fecha.getMonth()
	var m1 = ''
if(d < 10){
d1= "0"+d}
else{d1=d};
if(m < 10){
m1= "0"+m+1}
else{m1=m+1};
var j = y+"-"+m1+"-"+d1

MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
const dbo = db.db("libreria");
var editoriales = ""; 
dbo.collection("editoriales").find({}).toArray()
.then((data) => { 
for(editorial of data){
editoriales += `<option value="${editorial.id}">${editorial.publisher}</option>`;
} 
res.status(200).render('add.html',{option:editoriales, max:j,user:req.session.nombre, add:req.body.isbn, level:req.session.level});
}) 
});}
     
else{
    var autores = [];
    if(req.body.authors1){autores.push(req.body.authors1)
    if(req.body.authors2){autores.push(req.body.authors2)
    if(req.body.authors3){autores.push(req.body.authors3)
    if(req.body.authors4){autores.push(req.body.authors4)
    if(req.body.authors5){autores.push(req.body.authors5)}}}}}

    var categori = [];
    if(req.body.categories1){categori.push(req.body.categories1)
    if(req.body.categories2){categori.push(req.body.categories2)
    if(req.body.categories3){categori.push(req.body.categories3)
    if(req.body.categories4){categori.push(req.body.categories4)
    if(req.body.categories5){categori.push(req.body.categories5)}}}}}
       
    var fecha = new Date(req.body.publishedDate)
        MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
        const dbo = db.db("libreria")
        dbo.collection("libros").insertOne(
            {   
                isbn: req.body.isbn,
                title: req.body.title,
                publishedDate: fecha ,
                country: req.body.country,
                IDpublisher: req.body.IDpublisher,
                description : req.body.description,
                pageCount: req.body.pageCount,
                authors: autores,
                categories: categori
            },
            function (err, res) {
                if (err) {
                db.close();
                return console.log(err);
                }
                db.close()
            })
    res.status(200).send(`
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Books</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">
    <link rel="stylesheet" href="/public/estilos.css">
    </head>
    <body id="contenedor"></body>
    <h1>You added successfully the Book ${req.body.title}</h1><a class="btn btn-primary" href="/add">Add book</a>
    </body>`)
        })}
}});
    
app.all('/addPublisher', (req, res)=>{
    
if(!req.session.login){res.status(200).render('index.html');}
else{
if(!req.body.publisher){
res.status(200).render('addPublisher.html',{user:req.session.nombre, add:req.body.publisher, level:req.session.level}); 
} 
else{
var addP = true
MongoClient.connect(MONGO_URL,{ useUnifiedTopology: true }, (err, db) => {  
    const dbo = db.db("libreria");  
    var id = 1;
    dbo.collection("editoriales").find().forEach(() => {   		
        id ++
        ;
    }, ()=>{
        dbo.collection("editoriales").insertOne(
            {   
                id: parseInt(id),
                publisher: req.body.publisher,
                country: req.body.country,
            }, ()=>{
    
                res.status(200).render('addPublisher.html',{user:req.session.nombre, add:req.body.publisher, level:req.session.level, addP:addP});
        });
    });
  });
}
}});


var port = "8080";

app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});


