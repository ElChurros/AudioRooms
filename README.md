# AudioRooms

This repository contains the source code for AudioRooms, an experiment on WebAudioAPI spacialization features.

## Running the app locally

```bash
git clone git git@github.com:ElChurros/AudioRooms.git
cd AudioRooms
npm install
cd client
npm install
npm run build
cd ..
npm start
```

Once the server has started, visit [localhost:8000](http://localhost:8000)

## Running the app with hot-reload
If you wish to modify the frontend React with hot-reload enabled, run the React development server from the `client` directory:
```bash
cd client
npm start
```

Once the React development server has started, visit [localhost:3000](http://localhost:3000) instead

If you wish to modify the backend code with hot-reload enabled, start the server with the following command instead:
```bash
npm run dev
```
