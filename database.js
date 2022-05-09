import dotenv from "dotenv"
import {MongoClient} from "mongodb"
dotenv.config()

const mongoClient = new MongoClient("mongodb+srv://xpepper3:03031998@cluster0.fobgs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
let dataBase = null

try{
    await mongoClient.connect()
    dataBase = mongoClient.db("my-wallet-db")
}catch(e){
    console.log(e)
}

export default dataBase;