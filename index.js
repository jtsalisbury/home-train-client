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
        chainLength: 1,
        parallel: 1,
        hardwareMapping: 'regular', // or 'regular'
    };

    const runtimeOptions = {
        ...LedMatrix.defaultRuntimeOptions(),
        gpioSlowdown: 2, // Required for slower Pis
    };

    matrix = new LedMatrix(matrixOptions, runtimeOptions);
    font = new Font("default", "/home/pi/Desktop/home-train-client/5x7.bdf");
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
        const jTrains = data.trains.filter(train => train.train_type == "J" || train.train_type == "Z");
        const mTrains = data.trains.filter(train => train.train_type == "M");

        const jTimes = jTrains.map(train => train.which_is_in);
        const mTimes = mTrains.map(train => train.which_is_in);

        matrix.clear().brightness(35).font(font);
        
        if (jTimes && jTimes.length > 0) {
            renderTrain({
                train_type: "J",
                train_destination: jTrains[0].train_destination,
                which_is_in: jTimes
            }, 2, 1);
        }

        if (mTimes && mTimes.length > 0) {
            renderTrain({
                train_type: "M",
                train_destination: mTrains[0].train_destination,
                which_is_in: mTimes

            }, 2, 17);
        }
        

        matrix.sync();
    }
}


const getColor = (train) => {
    if (train.train_type == "J" || train.train_type == "Z") {
        return 0x7A5228;

    } else if (train.train_type == "M") {
        return 0xCC4F14;
    }
}

const showNoTrains = () => {
    matrix.clear().brightness(35).font(font);
    matrix
        .fgColor(getColor(trains[0]))
        .drawText("No trains arriving", 0, 1);

    matrix.sync();
}

const fillCircle = (cx, cy, r) => {
    const yScale = 1.05; // try 1.05–1.15
  
    for (let dy = -r; dy <= r; dy++) {
      const adjustedDy = dy / yScale;
      const dx = Math.round(Math.sqrt(r * r - adjustedDy * adjustedDy));
      matrix.drawLine(cx - dx, cy + dy, cx + dx, cy + dy);
    }
  };

  const renderTrain = (train, x, y) => {
    const cx = x + 7;
    const cy = y + 7;
    const r = 7;
  
    matrix
      .fgColor(getColor(train));
  
    fillCircle(cx, cy, r);
  
    matrix
      .fgColor(0xFFFFFF)
      .bgColor(0x000000)
      .drawText(train.train_type, cx - 2, cy - 3);
      
    let str = "";
    for (let i = 0; i < 2 && i < train.which_is_in.length; i++) {
        let time = train.which_is_in[i]

        str += time + ",";
    }

    matrix
        .fgColor(0xFFFFFF) // amber
        .drawText(train.train_destination, x + 18, y + 1);  
    
    // Arrival time
    matrix
        .fgColor(0xCC8C00) // amber
        .drawText(str.substring(0, str.length - 1), x + 18, y + 8);  
  };

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