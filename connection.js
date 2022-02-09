var { MongoClient } = require('mongodb')
var { v4: uuidv4 } = require('uuid')
var SHA256 = require("crypto-js/sha256");

var user = process.env.DB_USER
var pass = process.env.DB_PASS
var host = process.env.DB_HOST
var port = process.env.DB_PORT
var dbName = process.env.DB_NAME

var url = `mongodb://${user}:${pass}@${host}:${port}/${dbName}`
var client 


function buildDB(){
    try{
        client = new MongoClient(url)
        client.connect((err, db) => {
            if(err) throw err
            var myDB = db.db(process.env.DB_NAME)

            var user_collection = 'users'
            var projects_collection = 'projects'

            myDB.listCollections({name: user_collection, name: projects_collection}).next(function(err, info){
                if(info){
                    console.log(`collection < ${user_collection} > exists`)
                    console.log(`collection < ${projects_collection} > exists`)
                }
                else{
                    myDB.createCollection(user_collection, function(err, res){
                        var hashed_pass = SHA256(process.env.ADMIN_PASS).toString()
                        var admin = {id: uuidv4(), email: process.env.ADMIN_EMAIL, password: hashed_pass}

                        myDB.collection(user_collection).insertOne(admin, function(err, res){
                            if (err) throw err
                            console.log(`admin account created`)
                        })
                        if (err) throw err
                        console.log(`collection < ${user_collection} > created`)
                    })
                    myDB.createCollection(projects_collection, function(err, res){
                        if (err) throw err
                        console.log(`collection < ${projects_collection} > created`)
                    }) 
                }
            })
        })
    }
    catch(err){
        console.error(err)
    }
}


function Database(){
    
    try{
        return new MongoClient(url)
    }
    catch(err){
        console.error(err)
    }
}

module.exports = { buildDB, Database }