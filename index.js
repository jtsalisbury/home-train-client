import fetch from 'node-fetch';
import { Font, LedMatrix } from 'rpi-led-matrix';

let matrix;
let font;
const initLedMatrix = () => {

    // Configuration for your specific matrix (adjust as needed)
    const matrixOptions = {
        ...LedMatrix.defaultMatrixOptions(),
        rows: 32,
        cols: 64,
        chainLength: 2,
        parallel: 1,
        hardwareMapping: 'regular', // or 'regular'
    };

    const runtimeOptions = {
        ...LedMatrix.defaultRuntimeOptions(),
        gpioSlowdown: 2, // Required for slower Pis
    };

    matrix = new LedMatrix(matrixOptions, runtimeOptions);
    font = new Font("default", "./5x7.bdf");
}


const updateTrainData = async () => {
    try {
        const response = await fetch("https://train-arrivals-6c5c64469c48.herokuapp.com/v1/arrivals");
        const json = await response.json();
        
        renderTrainData(json);

    } catch (e) {
        console.error("Failed to retrieve train data", e);
    }
}


const renderTrainData = (data) => {
    if (data == null || data.trains.length == 0) {
        showNoTrains();

    } else {
        if (data.trains.length > 3) {
            renderArrivalTimes(data.trains.slice(0, 3));
        } else {
            renderArrivalTimes(data.trains);
        }
    }
}


const getColor = (train) => {
    if (train.train_type == "J" || train.train_type == "Z") {
        return 0x996633;

    } else if (train.train_type == "M") {
        return 0xEB6800;
    }
}

const showNoTrains = () => {

}

const renderArrivalTimes = (trains) => {
    matrix.clear().brightness(100).font(font);

    matrix
        .fgColor(getColor(trains[0]))
        .drawText(trains[0].train_type + " - " + trains[0].which_is_in + " min", 0, 1);

    matrix
        .fgColor(getColor(trains[1]))
        .drawText(trains[1].train_type + " - " + trains[1].which_is_in + " min", 0, 10);

    matrix
        .fgColor(getColor(trains[2]))
        .drawText(trains[2].train_type + " - " + trains[2].which_is_in + " min", 0, 18);

    matrix.sync();
       
}


const start = () => {
    initLedMatrix();
    updateTrainData();

    setInterval(() => {
        updateTrainData();
    }, 4000);
}


(() => {
    start();
})();