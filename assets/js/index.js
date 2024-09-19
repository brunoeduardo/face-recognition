
const cam = document.getElementById('cam');
let canvasCam, canvasSize, getFaceName = null;

const getMedia = async (constraints) => {
    let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    cam.srcObject = stream;
    addListerner();
  } catch (err) {
  }
}

const addListerner = cam.addEventListener('play', async () => {
        canvasCam = faceapi.createCanvasFromMedia(cam);
        canvasSize = {
            width: cam.width,
            height: cam.height
        }
        getFaceName = await loadFaceNames();

        faceapi.matchDimensions(canvasCam, canvasSize);
        document.body.append(canvasCam)
        
        requestAnimationFrame(startDetection)
    })

const loadFaceNames = () => {
    const nameFace = ['Bruno', 'Patricia', 'Gabriel']

    return Promise.all(nameFace.map(async faceName => {
        const descriptions = []
        for (let index = 1; index <= 5; index++) {
            const imgFace = await faceapi.fetchImage(`/assets/lib/labels/${faceName}/${index}.png`);
             const detections = await faceapi
                .detectSingleFace(imgFace)
                .withFaceLandmarks()
                .withFaceDescriptor();
            detections ? descriptions.push(detections.descriptor) : null;
        }
        return new faceapi.LabeledFaceDescriptors(faceName, descriptions)
    }))
}

const clearCanvas = (canvas) => {
    canvas.getContext('2d').clearRect(0,0,canvas.width, canvas.height);
}

const startDetection =  async ()  => {
           
            const detections  = await faceapi.detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender()
                .withFaceDescriptors();

            const resizeDetections = await faceapi.resizeResults(detections, canvasSize);
            const faceMatcher = new faceapi.FaceMatcher(getFaceName,60)
            const facesLabels = resizeDetections.map( d => {
                return faceMatcher.findBestMatch(d.descriptor)
            });
    
            clearCanvas(canvasCam);

            faceapi.draw.drawDetections(canvasCam, resizeDetections);
            faceapi.draw.drawFaceLandmarks(canvasCam, resizeDetections);
            faceapi.draw.drawFaceExpressions(canvasCam, resizeDetections, 0.05);
            
            resizeDetections.forEach(detection => {
                const { age, gender, genderProbability } = detection;
                new faceapi.draw.DrawTextField([
                    `${parseInt(age,10)} years`, 
                    `${gender} (${parseInt(genderProbability * 100, 10)}%)`
                ], detection.detection.box.topRight).draw(canvasCam)
            })

            facesLabels.forEach((result, index) => {
                const box = resizeDetections[index].detection.box
                const { label, distance} = result
                new faceapi.draw.DrawTextField([
                    `${label} (${parseInt(distance *100, 10)}%)`
                ], box.bottomRight).draw(canvasCam)
            })

            requestAnimationFrame(startDetection)
}

Promise.all([
    faceapi.loadTinyFaceDetectorModel('/assets/lib/models'),
    faceapi.loadFaceLandmarkTinyModel('/assets/lib/models'),
    faceapi.loadFaceLandmarkModel('/assets/lib/models'),
    faceapi.loadFaceRecognitionModel('/assets/lib/models'),
    faceapi.loadFaceExpressionModel('/assets/lib/models'),
    faceapi.loadAgeGenderModel('/assets/lib/models'),
    faceapi.loadSsdMobilenetv1Model('/assets/lib/models')
]).then(
    getMedia({video: true})
)






