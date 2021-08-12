var express = require("express");
var router = express.Router();
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const Gtts = require("gtts");
const fs = require("fs");
const cp = require("child_process");
// var youtubeMp3Converter = require("youtube-mp3-converter");
var ffmpeg = require("ffmpeg-static");
const ytdl = require("ytdl-core");
var multer = require("multer");
var upload = multer({ dest: "uploads/" });

const path = require("path");

const speechConfig = sdk.SpeechConfig.fromSubscription(
  "f23235972e5c4432854dfd85d9403472",
  "eastus"
);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ title: "Express" });
  // res.render("index", { title: "Express" });
});

router.post("/text-to-speech", (req, res) => {
  let { text, lang } = req.body;
  if (!text) {
    text = "Please enter a text";
  }
  if (!lang) {
    lang = "en";
  }
  const gtts = new Gtts(text, lang);
  const outputFile = Date.now() + "output.mp3";

  gtts.save(outputFile, function (err, result) {
    if (err) {
      fs.unlinkSync(outputFile);
      res.status(500).send("Unable to convert to audio");
    }
    let buffer = fs.readFileSync(outputFile);
    let bufferBase64 = new Buffer(buffer);

    res.send(bufferBase64);
    fs.unlinkSync(outputFile);
  });
});

router.post("/audio-to-text", async (req, res) => {
  let audioConfig = sdk.AudioConfig.fromWavFileInput(
    fs.readFileSync(path.join(__dirname, "test.wav"))
  );
  let text = "";
  let lastWord = "";
  // var audioConfig = fs.readFileSync(path.join(__dirname, "test.wav"));
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  recognizer.recognizing = (s, e) => {
    console.log(`RECOGNIZING: Text=${e.result.text}`);

    let getText = e.result.text;

    if (lastWord.length > getText.length) {
      lastWord = getText;
      text += lastWord;
    }
    lastWord = getText;
  };
  recognizer.recognized = (s, e) => {
    if (e.result.reason == ResultReason.RecognizedSpeech) {
      console.log(`RECOGNIZED: Text=${e.result.text}`);
    } else if (e.result.reason == ResultReason.NoMatch) {
      console.log("NOMATCH: Speech could not be recognized.");
    }
  };

  recognizer.canceled = (s, e) => {
    console.log(`CANCELED: Reason=${e.reason}`);

    text += lastWord + ".";

    if (e.reason == CancellationReason.Error) {
      console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
      console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
      console.log("CANCELED: Did you update the key and location/region info?");
    }

    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.sessionStopped = (s, e) => {
    console.log("\n    Session stopped event.");
    recognizer.stopContinuousRecognitionAsync();
    console.log("textlast == >", text);
    res.send(text);
  };

  recognizer.startContinuousRecognitionAsync();
  // res.send("done");
  // var readStream = fs.createReadStream(path.join(__dirname, "test.wav"));
  // // console.log(fs.readFileSync(path.join(__dirname, "test.wav")));
  // let pushStream = sdk.AudioInputStream.createPushStream();

  // fs.createReadStream(path.join(__dirname, "test.wav"))
  //   .on("data", function (arrayBuffer) {
  //     pushStream.write(arrayBuffer.slice());
  //   })
  //   .on("end", function () {
  //     pushStream.close();
  //   });

  // let audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  // let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  // recognizer.recognizeOnceAsync((result) => {
  //   console.log(`RECOGNIZED: Text=${result.text}`);
  //   res.send(result.text);
  //   recognizer.close();
  // });
  // // readStream.on("open", function () {
  // //   console.log(readStream.pipe(res));
  // //   // let audioConfig = sdk.AudioConfig.fromWavFileInput(readStream.pipe(res));
  // //   //   let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  // //   //   recognizer.recognizeOnceAsync((result) => {
  // //   //     console.log(`RECOGNIZED: Text=${result.text}`);
  // //   //     res.send(result.text);
  // //   //     recognizer.close();
  // //   //   });
  // // });

  // // readStream.on("error", function () {
  // //   res.end(err);
  // // });

  // console.log("hello world");
});

module.exports = router;
