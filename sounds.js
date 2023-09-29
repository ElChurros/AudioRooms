
const fs = require('fs')

const getFileNames = (dir, files = []) => {
    const fileList = fs.readdirSync(dir)
    fileList.forEach((file) => {
        const path = `${dir}/${file}`
        if (fs.statSync(path).isDirectory()) {
            getFiles(path, files)
        } else {
            const fileInfo = {
                name: file,
                path: path.replace(/^(public\/)/, "")
            }
            files.push(fileInfo)
        }
    })
    return files
}

const audioFiles = getFileNames('public/audio')

module.exports = {
    audioFiles
}