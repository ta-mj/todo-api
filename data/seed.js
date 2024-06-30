import mongoose from "mongoose";
import data from './mock.js';
import Task from '../models/Task.js';
import { DATABASE_URL } from "../env.js";

mongoose.connect(DATABASE_URL);

//파라미터 : 삭제 조건
await Task.deleteMany({});
//데이터 삽입
await Task.insertMany(data);

//커넥션 종료
mongoose.connection.close();
