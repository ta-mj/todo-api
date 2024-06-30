import express from 'express';
import mongoose from 'mongoose';
import Task from './models/Task.js';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
//모든 주소에 대해서 CORS 허용
//app.use(cors());
//특정 주소에 대해서만 CORS 허용
const corsOptions = {
    origin : ['http://127.0.01:5500' , 'https://my-todo.com'],
};
app.use(cors(corsOptions));
app.use(express.json());/*앱 전체에서 리퀘스트의 context-type이 json일 
경우 자동으로 바디를 파싱해서 자바스크립트 객체
로 변환하고 req.body에 담아준다!*/

function asyncHandler(handler){
    return async function(req, res){
        try{
            await handler(req, res);
        } catch(e){
            if(e.name === 'ValidationError'){
                res.status(400).send({message: e.message});
            } else if(e.name === 'CaseError'){
                res.status(404).send({message: 'Cannot find given id.'});
            } else{
                res.status(500).send({message: e.message});
            }
        }
    }
}

mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));//비동기로 처리된다!

app.get('/tasks', asyncHandler(async (req, res) => {
    /**
     * 쿼리 파라미터
     * - sort : 'oldest'인 경우 오래된 태스크 기준, 나머지 경우 새로운 태스크 기준
     * - count : 태스크 개수
     */
    const sort = req.query.sort;
    const count = Number(req.query.count) || 0 ;//파라미터는 모두 문자열로 전달됨!
    
    const sortOption = { createdAt : sort === 'oldest' ? 'asc' : 'desc'};
    const tasks = await Task.find().sort(sortOption).limit(count); //아무 argument가 없을 경우 모든 데이터를 받아옴

    res.send(tasks);
}));

//:id -> url parameter
app.get('/tasks/:id', asyncHandler(async (req, res) => {
    const id = req.params.id;//mongoDB에서 사용되는 id는 문자열 형태! Number 형변환 필요 없음
    const task = await Task.findById(id); //query를 리턴 , promise와 유사하게 await 키워드를 통해 결과를 받아올 수 있다!
    if(task){
        res.send(task);
    }
    else{
        res.status(404).send({message : 'Cannot find given id.'});
    }
}));

app.post('/tasks' , asyncHandler(async (req,res) =>{
    const newTask = await Task.create(req.body);
    res.status(201).send(newTask);
}));

app.patch('/tasks/:id', asyncHandler(async (req, res) => {
    const id = req.params.id;
    const task = await Task.findById(id);
    if(task){
        //찾은 task에서 body 안에 들어있는 정보(수정해야 할 정보)에 해당하는 프로퍼티의 값만 수정한다
        Object.keys(req.body).forEach((key) =>{
            task[key] = req.body[key];
        });
        await task.save();
        res.send(task);
    }
    else{
        res.status(404).send({message : 'Cannot find given id.'});
    }
}));

app.delete('/tasks/:id', asyncHandler(async (req, res) => {
    const id = req.params.id;
    const task = await Task.findByIdAndDelete(id); // 찾지 못하면 null
    if(task){
        res.sendStatus(204);
    }
    else{
        res.status(404).send({message : 'Cannot find given id.'});
    }
}));

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
