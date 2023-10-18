'use strict';

const BoardModel = require("../models").Board;
const ThreadModel = require("../models").Thread;
const ReplyModel = require("../models").Reply;

module.exports = function (app) {

  app.route('/api/threads/:board')
    .post((req, res) => {
      const { text, delete_password } = req.body;
      let board = req.body.board;
      if (!board) {
        board = req.params.board;
      }
      const newThread = new ThreadModel({
        text: text,
        delete_password: delete_password,
        replies: [],
      });
      //console.log("newThread",newThread);
      BoardModel.findOne({ name: board })
        .then((Boarddata) => {
          // console.log(Boarddata);
          if(!Boarddata){
            const newBoard = BoardModel({
              name: board,
              Thread:[],
            });
            newBoard.threads.push(newThread);
            newBoard.save().then((data)=>{
              if(!data){
                res.send("There was and error saving in newBoard Save");
              }else res.json(newThread);
            },(err)=>{
              res.send("There was and error saving in post");
            });
          }else{
            Boarddata.threads.push(newThread);
            Boarddata.save().then((data)=>{
              if(!data){
                res.send("There was and error saving in post");
              }else{
                res.json(newThread);
              }
            });
          }

        }, (err)=> {
          res.send("There was and error to findOne");
        })


    })
    .get((req,res)=>{
      const board = req.params.board;

      BoardModel.findOne({name:board}).then((data)=>{
        // console.log(data);
        if(!data){
          
          res.json({error:"No board with this name"});
        }else{
          const threads = data.threads.map((thread)=>{
            const{ _id,text,created_on,bumped_on,reported,delete_password,replies}=thread;
            return { _id,text,created_on,bumped_on,reported,delete_password,replies,replycount:thread.replies.length }
          });
          res.json(threads);
        }
      });
    })
    .put((req,res)=>{
      const board = req.params.board; 
      const {report_id} = req.body;
      if(!report_id){
         report_id = req.body.thread_id;
      }
      //console.log(req.body);
      BoardModel.findOne({name: board}).then((boardData)=>{
        //console.log(boardData);
        if(!boardData){
          res.send("error:Board not found");
        }else{
          const date = new Date();
          //console.log(report_id);
          // if(boardData.threads)
          boardData.threads.id(report_id).reported = true;
          boardData.threads.id(report_id).bumped_on = date;
          //console.log(boardData.threads.id(report_id));
          boardData.save().then((updateData)=>{
            res.send("Success");
          });

        }
      },(err)=>{
        console.log(err);
      });
    })
    .delete((req,res)=>{
      const board = req.params.board;      
      const {thread_id,delete_password} = req.body;

      BoardModel.findOne({name: board}).then((boardData)=>{
        // console.log(boardData);
        if(!boardData){
          res.send("error:Board not found");
        }else{
                    
          if(boardData.threads.id(thread_id).delete_password === delete_password){
            boardData.threads.id(thread_id).deleteOne();
          }else{
            res.send("Incorrect Password");
            return;
          }
          boardData.save().then((updateData)=>{
            res.send("Success");
          })
          
          
        }
      },(err)=>{
        console.log(err);
      });
    })
    ;

  app.route('/api/replies/:board')
  .post((req,res)=>{
    const {thread_id,text,delete_password} = req.body;
    const board = req.params.board;
    const newReply = new ReplyModel({
      text: text,
      delete_password: delete_password
    });
    BoardModel.findOne({name:board}).then((boardData)=>{
      const date = new Date();
      let threadToAddReply = boardData.threads.id(thread_id);
      threadToAddReply.bumped_on = date;
      threadToAddReply.replies.push(newReply);
      boardData.save().then((updateData)=>{
        res.json(updateData);
      });
    });
  })
  .get((req,res)=>{
    const board = req.params.board;
    BoardModel.findOne({name:board}).then((boardData)=>{
      if(!boardData){
        res.json({error: "No board with this name"});
      }else{
        //console.log(req.query);
        const thread = boardData.threads.id(req.query.thread_id);
        res.json(thread);
      }
    });
  })
  .put((req,res)=>{
    const board = req.params.board;      
    const {thread_id,reply_id} = req.body;
    BoardModel.findOne({name: board}).then((boardData)=>{
      //console.log(boardData);
      if(!boardData){
        res.send("error:Board not found");
      }else{
        let thread = boardData.threads.id(thread_id);
        let reply = thread.replies.id(reply_id);
        reply.reported = true;
        reply.bumped_on = new Date();

        boardData.save().then((updateData)=>{
          res.send("Success");
        });

      }
    },(err)=>{
      console.log(err);
    });
  })
  .delete((req,res)=>{
    const board = req.params.board;      
    const {thread_id,reply_id,delete_password} = req.body;
    BoardModel.findOne({name: board}).then((boardData)=>{
      //console.log(boardData);
      if(!boardData){
        res.send("error:Board not found");
      }else{
        let thread = boardData.threads.id(thread_id);
        let reply = thread.replies.id(reply_id);

        if(reply.delete_password === delete_password){
          reply.deleteOne();
        }else{
          res.send("Incorrect password");
          return;
        }
        
        boardData.save().then((updateData)=>{
          res.send("Success");
        });

      }
    },(err)=>{
      console.log(err);
    });
  })
  ;

};
