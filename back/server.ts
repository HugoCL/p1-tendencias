// Packages Imports
import express from 'express';

const app = express();
import cors from 'cors';
import mqtt from 'mqtt';
import Nano from 'nano';
import process, { send } from 'process';
import * as dotenv from 'dotenv';
dotenv.config();
import { Device, DeviceData } from './models';
import * as http from 'http';
import { Server } from 'socket.io';

var server = http.createServer(app);

var io = new Server(server);

server.listen(3000);

console.log(`Server running at http://*:3000/`);

const nano = Nano(
    `https://${process.env.TENANT}:${process.env.PASSWORD}@${process.env.REMOTE_COUCHDB_URL}`
);

const client = mqtt.connect('ws://mqttws.hugocastro.dev');

// App Settings and Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.get('/', (req, res) => {
    res.send('P1 Tendencias');
});

function mqttConnect() {
    client.subscribe('suscribe', function (err) {
        // if a message arrives, do something with it
        client.on('message', async function (topic, message) {
            // the json message is like this example: {"device":"temperatura-humedad","topic":"sensor/tmp1"}
            const db = nano.db.use<Device>('p1-tendencias');
            const data = JSON.parse(message.toString());
            const id = `devices:${topic.replace('/', '-')}`;
            // check if the device exists
            const deviceExists = await db
                .get(id)
                .then((body) => {
                    return true;
                })
                .catch((err) => {
                    return false;
                });
            if (deviceExists) {
                return;
            }
            // We register the device
            const device = new Device(id, data.device, data.topic);
            await db
                .insert(device)
                .then((body) => {
                    device.processAPIResponse(body);
                    console.log(body);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    });
}

function mqttListen() {
    client.subscribe('sensor/#', function (err) {
        // if a message arrives, do something with it
        client.on('message', async function (topic, message) {
            // the json message is like this example: {"data": {"temperature": {'value': 20, 'unit': 'C'}, "humidity": {'value': 20, 'unit': '%'}}}
            if (topic.startsWith('sensor/')) {
                const db = nano.db.use<DeviceData>('p1-tendencias');
                const jsonData = JSON.parse(message.toString());
                const idDevice = `devices:${topic.replace('/', '-')}`;
                // check the device exists and its name
                const device = await db
                    .get(idDevice)
                    .then((body) => {
                        return body;
                    })
                    .catch((err) => {
                        return undefined;
                    });
                if (device === undefined) {
                    return;
                }
                const deviceName = device.device;
                for (const key in jsonData.data) {
                    const id = `data-${deviceName}-${key}:${new Date().getTime()}`;
                    const deviceData = new DeviceData(
                        id,
                        deviceName,
                        jsonData.data[key].value,
                        jsonData.data[key].unit,
                        new Date().toISOString()
                    );
                    await db
                        .insert(deviceData)
                        .then((body) => {
                            deviceData.processAPIResponse(body);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }
            }
        });
    });
}

function sendDBData() {
    io.on('connection', (socket) => {
        console.log('Connected!');
        socket.on('get-stream-data', (data) => {
            const db = nano.db.use<DeviceData>('p1-tendencias');
            db.changesReader
                .start({
                    since: 'now',
                    includeDocs: true,
                })
                .on('change', async function (change) {
                    if (change.id.startsWith('data-')) {
                        socket.emit('stream-data', change.doc);
                    }
                });
        });
    });
}

mqttConnect();
mqttListen();
sendDBData();

module.exports = app;
