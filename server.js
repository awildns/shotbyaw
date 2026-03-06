const express = require("express")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const cors = require("cors")
const sharp = require("sharp")
const jwt = require("jsonwebtoken")

const app = express()

app.use(cors())
app.use(express.json())

const SECRET = "photo_admin_secret"

const ADMIN = {
username: "shotbyaw",
password: "Photo67!"
}

const categories = ["music","event","fashion","personal"]

// LOGIN
app.post("/admin/login",(req,res)=>{

const {username,password} = req.body

if(username === ADMIN.username && password === ADMIN.password){

const token = jwt.sign({admin:true},SECRET)

return res.json({token})

}

res.status(401).json({error:"Invalid login"})

})

// AUTH
function auth(req,res,next){

const token = req.headers.authorization

if(!token) return res.sendStatus(401)

try{

jwt.verify(token,SECRET)
next()

}catch{

res.sendStatus(403)

}

}

// STORAGE
const storage = multer.memoryStorage()

const upload = multer({storage})

// UPLOAD
app.post("/admin/upload",auth,upload.single("photo"),async(req,res)=>{

const {category,title} = req.body

if(!categories.includes(category)){
return res.status(400).json({error:"Invalid category"})
}

const folder = path.join(__dirname,"uploads",category)

fs.mkdirSync(folder,{recursive:true})

const filename = Date.now()+".jpg"

const filepath = path.join(folder,filename)

await sharp(req.file.buffer)
.resize({width:2000})
.jpeg({quality:80})
.toFile(filepath)

const photo = {
id:Date.now(),
title,
file:`/uploads/${category}/${filename}`
}

const jsonFile = path.join(__dirname,"uploads",`${category}.json`)

let data=[]

if(fs.existsSync(jsonFile)){
data=JSON.parse(fs.readFileSync(jsonFile))
}

data.push(photo)

fs.writeFileSync(jsonFile,JSON.stringify(data,null,2))

res.json(photo)

})

// GET PHOTOS
app.get("/gallery/:category",(req,res)=>{

const file=path.join(__dirname,"uploads",`${req.params.category}.json`)

if(!fs.existsSync(file)) return res.json([])

res.json(JSON.parse(fs.readFileSync(file)))

})

// DELETE
app.delete("/admin/photo/:category/:id",auth,(req,res)=>{

const {category,id}=req.params

const file=path.join(__dirname,"uploads",`${category}.json`)

let data=JSON.parse(fs.readFileSync(file))

data=data.filter(p=>p.id!=id)

fs.writeFileSync(file,JSON.stringify(data,null,2))

res.json({success:true})

})

app.use("/uploads",express.static("uploads"))

app.listen(3001,()=>{

console.log("Server running on port 3001")

})