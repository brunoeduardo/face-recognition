const cam = document.getElementById('cam');

const getMedia = async (constraints) => {
    let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    cam.srcObject = stream;
  } catch (err) {
    console.log('err', err)
  }
}

Promise.all([
    faceapi.loadTinyFaceDetectorModel('/assets/lib/models'),
    faceapi.loadFaceLandmarkModel('/assets/lib/models'),
    faceapi.loadFaceRecognitionModel('/assets/lib/models'),
    faceapi.loadFaceExpressionModel('/assets/lib/models'),
    faceapi.loadFaceLandmarkTinyModel('/assets/lib/models'),
    faceapi.loadAgeGenderModel('/assets/lib/models')
]).then(
    getMedia({video: true})
)

cam.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(cam);
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }
    faceapi.matchDimensions(canvas, canvasSize)
    document.body.append(canvas)
    setInterval(async () => {
        const detections  = await faceapi.detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

        const resizeDetections =  await faceapi.resizeResults(detections, canvasSize);
        canvas.getContext('2d').clearRect(0,0,canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizeDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizeDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizeDetections, 0.05);
        resizeDetections.forEach(detection => {
            const { age, gender, genderProbability } = detection;
            new faceapi.draw.DrawTextField([
                `${parseInt(age,10)} years`, 
                `${gender} (${parseInt(genderProbability * 100, 10)}%)`
            ], detection.detection.box.topRight).draw(canvas)
        })
    }, 100)
})







