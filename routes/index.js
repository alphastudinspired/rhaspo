var express = require("express");
var router = express.Router();
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const Gtts = require("gtts");
const fs = require("fs");

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
  let fileName = Date.now() + "_" + req.files.file.name;
  let file = req.files.file;
  let uploadPath = __dirname + "/uploads/" + fileName;

  file.mv(uploadPath, (err) => {
    if (err) res.send(err);

    let audioConfig = sdk.AudioConfig.fromWavFileInput(
      fs.readFileSync(uploadPath)
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
        console.log(
          "CANCELED: Did you update the key and location/region info?"
        );
      }

      recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
      console.log("\n    Session stopped event.");
      recognizer.stopContinuousRecognitionAsync();
      console.log("textlast == >", text);
      fs.unlinkSync(uploadPath);
      res.status(200).send(text);
    };

    recognizer.startContinuousRecognitionAsync();
    // if (res) console.log(fs.readFileSync(uploadPath));
  });
});

module.exports = router;
