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
      

    // Arrival time
    matrix
        .fgColor(0xCC8C00) // amber
        .drawText(new String(train.which_is_in), x + 18, y + 4);  
  };

const renderArrivalTimes = (trains) => {
    matrix.clear().brightness(35).font(font);

    if (trains[0]) {
        renderTrain(trains[0], 2, 1);
    }

    if (trains[1]) {
        renderTrain(trains[1], 2, 17)
    }
   
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