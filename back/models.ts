import Nano from 'nano';

interface device extends Nano.MaybeDocument {
    device: string;
    topic: string;
}

class Device implements device {
    _id: string;
    _rev: string;
    device: string;
    topic: string;

    constructor(id: string, device: string, topic: string) {
        this._id = id;
        this.device = device;
        this.topic = topic;
        this._rev = undefined;
    }

    processAPIResponse(response: Nano.DocumentInsertResponse) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}

interface DeviceData extends Nano.MaybeDocument {
    device: string;
    data: string;
    unit: string;
    timestamp: string;
}

class DeviceData implements DeviceData {
    _id: string;
    _rev: string;
    device: string;
    data: string;
    unit: string;
    timestamp: string;

    constructor(
        id: string,
        device: string,
        data: string,
        unit: string,
        timestamp: string
    ) {
        this._id = id;
        this.device = device;
        this.data = data;
        this.unit = unit;
        this.timestamp = timestamp;
        this._rev = undefined;
    }

    processAPIResponse(response: Nano.DocumentInsertResponse) {
        if (response.ok === true) {
            this._id = response.id;
            this._rev = response.rev;
        }
    }
}
export { Device, DeviceData };
