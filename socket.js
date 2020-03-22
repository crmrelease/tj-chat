const SocketIO = require('socket.io');
const axios = require('axios');

module.exports=(server,app,sessionMiddleware)=>{
    const io = SocketIO(server,{path:'/socket.io'});
    //접속하는 패스
    app.set('io',io)
    //익스프레스 변수 저장 방법 나중에 라우터에서 io를 쓰기 위해서

    const room = io.of('/room');
    const chat = io.of('/chat');
    io.use((socket,next)=>{//익스프레스 미들웨어를 소켓에서 쓰는 방법
        sessionMiddleware(socket.request,socket.request.res,next)
    });

    room.on('connection',(socket)=>{
        console.log('네임스페이스 접속');
        socket.on('disconnect',()=>{
            console.log('room 네임스페이스 접속 해제')
        })
    })
    chat.on('connection', (socket) => {
        console.log('chat 네임스페이스에 접속');
        const req = socket.request;
        const { headers: { referer } } = req;
        const roomId = referer
          .split('/')[referer.split('/').length - 1]
          .replace(/\?.+/, '');
        socket.join(roomId);
        socket.to(roomId).emit('join', {
          user: 'system',
          chat: `${req.session.color}님이 입장하셨습니다.`,
        });
        socket.on('disconnect', () => {
          console.log('chat 네임스페이스 접속 해제');
          socket.leave(roomId);
          const currentRoom = socket.adapter.rooms[roomId];
          //현재 방에 대한 정보
          const userCount = currentRoom ? currentRoom.length : 0;
          //현재 방에 대한 사용자수
          if (userCount === 0) {
            axios.delete(`http://localhost:6001/room/${roomId}`)
            //방에 인원이 없으면 방 지우기
              .then(() => {
                console.log('방 제거 요청 성공');
              })
              .catch((error) => {
                console.error(error);
              });
          } else {
            socket.to(roomId).emit('exit', {
              user: 'system',
              chat: `${req.session.color}님이 퇴장하셨습니다.`,
            });
          }
        });
      });
    };
    // io.on('connection',(socket)=>{
    //     const req = socket.request;
    //     const ip = req.headers['x-forwarded-for']||req.connection.remoteAddress;
    //     console.log('새로운 클라이언트 접속',ip,socket.id,req.ip)
    //     socket.on('disconnect',()=>{
    //         console.log('클라이언트 접속 해제',ip,socket.id);
    //         clearInterval(socket.interval);
    //     });
    //     socket.on('error',(error)=>{
    //         console.error(error);
    //     })
    //     socket.on('reply',(data)=>{
    //         console.log(data);
    //     })
    //     socket.on('message',(data)=>{
    //         console.log(data);
    //     })
    //     socket.interval=setInterval(()=>{
    //         socket.emit('news','Hello Socket.IO');//키와 값, 프론트에서 onnews로 받을 수 있음
    //     },3000)
    // });


// 여기는 ws로 연결한 경우 
//const WebSocket = require('ws');

// module.exports=(server)=>{
//     const ws_server = new WebSocket.Server({server});

//     ws_server.on('connection',(ws,req)=>{
//         const ip = req.headers['x-forwarded-for']||req.connection.remoteAddress;
//         console.log('클라이언트 접속',ip)
//         ws.on('message',(message)=>{
//             console.log(message);
//         })
//         ws.on('error',(error)=>{
//             console.error(error);
//         })
//         ws.on('close',()=>{
//             console.log('접속 해제',ip)
//             clearInterval(ws.interval);//꼭 해제하면 커넥팅 종료해주고
//         });
//         const interval = setInterval(()=>{
//             if(ws.readyState===ws.OPEN){
//                 ws.send('서버에서 클라이언트로 메세지를 보냅니다')
//                }   //ws.connecting, ws.closing, ws.close 이렇게 상태 4개 있음
//         },3000);
//         ws.interval = interval
//     });

// };

// //각각 클라이언트단에서 onmessage, onopen등과 여기의 메소드들이 매칭됨