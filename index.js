require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require('path')
const { addUserToRoom, removeUserFromRoom, getUserRoom, getUser, getRoom, addSourceToRoom, removeSourceFromRoom } = require('./users.js')
const { clamp } = require('./utils.js')
const { audioFiles } = require('./sounds.js')

const app = express()

console.log(__dirname)

app.use(cors())
app.use(express.json())
app.use('/file', express.static('public'))
app.use(express.static('client/build'))

app.post('/source', (req, res) => {
    const {pos, id, filename} = req.body
    res.status(201).end()
    const room = getUserRoom(id)
    const source = addSourceToRoom(filename, pos, room)
    io.to(`${room.id}`).emit('source-added', source)
})

app.delete('/source/:sourceId', (req, res) => {
    const socketId = req.get('x-socket-id')
    const sourceId = req.params.sourceId
    const room = getUserRoom(socketId)
    removeSourceFromRoom(sourceId, room)
    io.to(`${room.id}`).emit('source-removed', sourceId)
    res.status(204).end()
})

app.get('/available-audio-files', (req, res) => {
    res.status(200).json(audioFiles)
})

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'))
})


const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: [`${process.env.CLIENT_HOST}:${process.env.CLIENT_PORT}`]
    }
});

io.on('connection', (socket) => {    
    socket.on('join-room', (roomId, answer) => {
        const room = getRoom(roomId)
        if (room && room.users.length >= process.env.DEFAULT_MAX_USERS_IN_ROOM) {
            answer({status: 'Access denied : room is full'})
            return
        }
        answer({status: 'ok'})
        const roomData = addUserToRoom(socket.id, roomId)
        socket.join(`${roomId}`)
        socket.to(`${roomId}`).emit('user-joined', getUser(socket.id))
        socket.emit('initial-users', roomData)
    })

    socket.on('leave-room', () => {
        const room = getUserRoom(socket.id)
        if (!room)
            return
        socket.leave(`${room.id}`)
        removeUserFromRoom(socket.id)
        io.to(`${room.id}`).emit('user-left', socket.id)
    })

    socket.on('disconnect', () => {
        const room = getUserRoom(socket.id)
        if (!room)
            return
        socket.leave(`${room.id}`)
        removeUserFromRoom(socket.id)
        io.to(`${room.id}`).emit('user-left', socket.id)
    })

    socket.on('call:offer', data => {
        io.to(data.userToSignal).emit('call:offer', { signal: data.signal, user: getUser(socket.id) })
    })

    socket.on('call:accept', data => {
        io.to(data.callerId).emit('call:accept', { signal: data.signal, id: socket.id })
    })

    socket.on('user movement', (key) => {
        const user = getUser(socket.id)
        const room = getUserRoom(socket.id)
        const { x, y, direction } = user.pos
        switch (key) {
            case 'ArrowRight':
                user.pos.direction = (direction - 3)
                break
            case 'ArrowLeft':
                user.pos.direction = (direction + 3)
                break
            case 'ArrowUp':
                user.pos.x = clamp(x + 3 * Math.cos(direction * Math.PI / 180), 0, 100)
                user.pos.y = clamp(y + 3 * Math.sin(direction * Math.PI / 180), 0, 100)
                break
            case 'ArrowDown':
                user.pos.x = clamp(x - 3 * Math.cos(direction * Math.PI / 180), 0, 100)
                user.pos.y = clamp(y - 3 * Math.sin(direction * Math.PI / 180), 0, 100)
                break
            default:
                return
            }
            io.to(`${room.id}`).emit('user movement', user)
    })
})

server.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`)
})