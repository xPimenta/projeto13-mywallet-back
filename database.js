import dotenv from "dotenv"
import {MongoClient} from "mongodb"
dotenv.config()

const mongoClient = new MongoClient("MONGO_URI")
let dataBase = null

try{
    await mongoClient.connect()
    dataBase = mongoClient.db("my-wallet-db")
}catch(e){
    console.log(e)
}

export default dataBase;