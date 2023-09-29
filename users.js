const { v4: uuidv4 } = require('uuid')
const fs = require('fs')

const rooms = []
const socketToRoom = {}

function randomPos() {
    return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        direction: Math.random() * 360
    }
}

const createRoom = (roomId) => {
    let roomData
    try {
        const data = fs.readFileSync(`maps/${roomId}-room.json`)
        roomData = JSON.parse(data)
    } catch (error) {
        roomData = {
            maxUsers: process.env.DEFAULT_MAX_USERS_IN_ROOM,
            sources: []
        }
    }
    const newRoomIndex = rooms.push({ id: roomId, users: [], roomData: roomData }) - 1
    return rooms[newRoomIndex]
}

const removeRoom = (roomId) => {
    rooms.splice(rooms.findIndex(r => r.id == roomId), 1)
}

const getRoom = (roomId) => {
    return rooms.find(r => r.id == roomId)
}

const getUserRoom = (userId) => {
    const roomId = socketToRoom[userId]
    return rooms.find(r => r.id == roomId)
}

const getUser = (userId) => {
    return getUserRoom(userId).users.find(u => u.id === userId)
}

const addUserToRoom = (userId, roomId) => {
    let room = getRoom(roomId)
    if (!room) {
        room = createRoom(roomId)
    }
    const pos = randomPos()
    room.users.push({ id: userId, pos })
    socketToRoom[userId] = roomId
    return room
}

const removeUserFromRoom = (userId) => {
    const room = getUserRoom(userId)
    if (!room)
        return
    room.users.splice(room.users.findIndex(u => u.id == userId), 1)
    if (room.users.length === 0)
        removeRoom(room.id)
    delete socketToRoom[userId]
}

const addSourceToRoom = (filename, pos, room) => {
    const source = {
        name: uuidv4(),
        file: filename,
        pos: {...pos, direction: 0},
        gain: 0.05,
        omnidirectional: true
    }
    room.roomData.sources.push(source)
    return source
}

module.exports = {
    getRoom,
    getUserRoom,
    getUser,
    addUserToRoom,
    removeUserFromRoom,
    addSourceToRoom,
}