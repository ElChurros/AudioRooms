const { v4: uuidv4 } = require('uuid')
const path = require('path')

const rooms = []
const socketToRoom = {}
const sourceToRoom = {}

function randomPos() {
    return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        direction: Math.random() * 360
    }
}

const createRoom = (roomId) => {
    const newRoomIndex = rooms.push({ id: roomId, users: [], sources: [] }) - 1
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
    return getRoom(roomId)
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
    const id = uuidv4()
    const source = {
        id: id,
        name: path.basename(filename),
        file: filename,
        pos: {...pos, direction: 0},
        gain: 0.1,
        omnidirectional: true
    }
    room.sources.push(source)
    sourceToRoom[id] = room.id
    return source
}

const removeSourceFromRoom = (id, room) => {
    room.sources.splice(room.sources.findIndex(s => s.id === id), 1)
    delete sourceToRoom[id]
}

const moveSource = (id, pos) => {
    const room = getRoom(sourceToRoom[id])
    if (!room)
        return
    const source = room.sources.find(s => s.id === id)
    if (!source)
        return
    source.pos = {...source.pos, ...pos}
}

module.exports = {
    getRoom,
    getUserRoom,
    getUser,
    addUserToRoom,
    removeUserFromRoom,
    addSourceToRoom,
    removeSourceFromRoom,
    moveSource
}