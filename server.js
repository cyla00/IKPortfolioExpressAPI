require('dotenv').config()

var { buildDB, Database } = require('./connection')
var { v4: uuidv4 } = require('uuid')

var nodemailer = require('nodemailer')

var express = require('express')
var cookieParser = require("cookie-parser")
var cors = require('cors')

var app = express()

app.use(express.static(__dirname))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors())
app.set('json spaces', 2)

// database first build
buildDB()

var client

var today = new Date();
var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + " " +  today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

// ADMIN LOGIN
app.post('/login', function(req, res){
    var b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    var [admin_email, admin_password] = Buffer.from(b64auth, 'base64').toString().split(':')

    client = Database()
    client.connect(async function(err, db){
        if(err) throw err
        var myDB = db.db(process.env.DB_NAME)
        var check = await myDB.collection(process.env.DB_ADMIN_COLLECTION).findOne({email: admin_email, password: admin_password})
        if(check){
            client.close()
            res.status(200).send({id: check.id})

            async function main(){
                var transporter = nodemailer.createTransport({
                    service: "Gmail",
                    secure: true,
                    auth: {
                      user: process.env.MAIL, 
                      pass: process.env.MAIL_PASS,
                    }, 
                  })
            
                await transporter.sendMail({
                  from: process.env.MAIL,
                  to: process.env.ADMIN_EMAIL,
                  subject: '⚠️IMPORTANT! New Login on your portfolio!',
                  html: `
                    <h1>SECURITY CHECK</h1>
                    <p>a new login in your portfolio Admin account today: ${date}</p>
                  `,
                })
              }
            main().catch(console.error)
        }
        else{
            client.close()
            res.sendStatus(401)
        }
    })
})

// ADMIN ADD PROJECT
app.post('/admin/add', function(req, res){
    var id = uuidv4()
    var title = req.body.data.title
    var description = req.body.data.description
    var image = req.body.data.link
    var check_id = req.body.data.id
    var date = new Date()
    var project_date = `${date.getFullYear()}-${date.getMonth() + 1}`

    client = Database()
    client.connect(async function(err, db){
        if(err) throw err
        var myDB = db.db(process.env.DB_NAME)
        var check = await myDB.collection(process.env.DB_ADMIN_COLLECTION).findOne({id: check_id})

        if(!check){
            res.sendStatus(401)
        }
        else{
            await myDB.collection(process.env.DB_PROJECTS_COLLECTION).insertOne({
                _id: id,
                title: title,
                description: description,
                image_link: image,
                date: project_date,
            }).then(() => {
                client.close()
                res.sendStatus(201)

                async function main(){
                    var transporter = nodemailer.createTransport({
                        service: "Gmail",
                        secure: true,
                        auth: {
                            user: process.env.MAIL, 
                            pass: process.env.MAIL_PASS,
                        }, 
                    })
            
                    await transporter.sendMail({
                    from: process.env.MAIL,
                    to: process.env.ADMIN_EMAIL,
                    subject: '⚠️IMPORTANT! New Project added!✅',
                    html: `
                        <h1>✅New project has been added✅</h1>
                        <p>Name: ${title}</p>
                        <p>today: ${date}</p>
                    `,
                    })
                }
                main().catch(console.error)
            })
        }
    })
})

// ADMIN DELETE PROJECT
app.post('/admin/remove', function(req, res){
    var project_id = req.body.data.id
    var check_id = req.body.data.check_id
    client = Database()
    client.connect(async function(err, db){
        var myDB = db.db(process.env.DB_NAME)

        var check = await myDB.collection(process.env.DB_ADMIN_COLLECTION).findOne({id: check_id})
        if(!check){
            res.sendStatus(401)
        }
        else{
            myDB.collection(process.env.DB_PROJECTS_COLLECTION).findOneAndDelete({_id: project_id}, (err, obj) => {
                if (err) throw err
                client.close()
                res.sendStatus(200)
                console.log(obj.value)

                async function main(){
                    var transporter = nodemailer.createTransport({
                        service: "Gmail",
                        secure: true,
                        auth: {
                            user: process.env.MAIL, 
                            pass: process.env.MAIL_PASS,
                        }, 
                    })
            
                    await transporter.sendMail({
                    from: process.env.MAIL,
                    to: process.env.ADMIN_EMAIL,
                    subject: '⚠️IMPORTANT! Project Removed!❌',
                    html: `
                        <h1>❌a project has been removed❌</h1>
                        <p>Project Name: ${obj.value.title}</p>
                        <p>Project _ID: ${project_id}</p>
                        <p>today: ${date}</p>
                    `,
                    })
                }
                main().catch(console.error)
            })
        }
    })
})


// SHOW PROJECTS
app.get('/api/projects', function(req, res){

    client = Database()
    client.connect(async function(err, db){
        if(err) throw err
        var myDB = db.db(process.env.DB_NAME)

        var data = []

        await myDB.collection(process.env.DB_PROJECTS_COLLECTION).find().forEach(function(proj){
            data.push(proj)
        })

        res.json(data)
        client.close()
    })
})


// CONTACT MANAGEMENT
app.post('/contactme', async function(req, res){
    var name = Buffer.from(req.body.name, 'base64').toString('ascii')
    var email = Buffer.from(req.body.email, 'base64').toString('ascii')
    var subject = Buffer.from(req.body.subject, 'base64').toString('ascii')
    var content = Buffer.from(req.body.content, 'base64').toString('ascii')

    async function main(){
        var transporter = nodemailer.createTransport({
            service: "Gmail",
            secure: true,
            auth: {
                user: process.env.MAIL, 
                pass: process.env.MAIL_PASS,
            }, 
        })
            
        await transporter.sendMail({
            from: process.env.MAIL,
            to: process.env.ADMIN_EMAIL,
            subject: '⚠️IMPORTANT! Someone has sent you a message!',
            html: `
                <h1>✅NEW MESSAGE✅</h1>
                <p style="font-weight: bold;">from: ${email}</p>
                <p>Name: ${name}</p>
                <p style="font-weight: bold;">Subject: ${subject}</p>
                <p>Message: ${content}</p>
                <p>today: ${date}</p>
            `,
            })
        }
    main().then(()=> {
        res.sendStatus(200)
    }).catch((err) => {
        console.log(err.message)
        res.sendStatus(200)
    })
})


// START SERVER
app.listen(process.env.EXPRESS_PORT || 4000, () => {
    console.log(`up: http://localhost:${process.env.EXPRESS_PORT}`)
})