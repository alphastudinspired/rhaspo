var express = require("express");
var router = express.Router();
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const Gtts = require("gtts");
const fs = require("fs");

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

module.exports = router;
