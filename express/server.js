const serverless = require("serverless-http");
const express = require("express");
const ObjectsToCsv = require("objects-to-csv");
require("console-stamp")(console, "[HH:MM:ss]");
const app = express();
const port = 5000;
let ok = true;
const router = express.Router();
const exemplu = {
    activ: 1,
    pachet: 1,
    enunt: "",
    ras: "",
};

let test = [];
const re = /.+/g;
const paragraph = "<p>";
const re2 = /^([a-z][.])/m;
const re3 = /\d+[.][ ]?[\t]?/;
function parseQ(strline, obj) {
    let a = re2.exec(strline);
    let index;
    let verif;
    if (a) {
        strline = paragraph.concat(strline, "</p>");
        if (!ok) {
            obj.enunt = obj.enunt.concat(strline);
        } else obj.ras = obj.ras.concat(strline);
        return obj;
    } else {
        if (!ok) {
            ok = true;
            // console.log("ok")
            if (strline.length > 4) {
                const regex = /R([0-9]+)([:.]) ?/;
                let aux = strline.replace(regex, "");
                if (aux === " ") return obj;
                strline = aux;
                a = re2.exec(strline);
                if (a) {
                    strline = strline.split(",");
                    strline.forEach((element) => {
                        obj.ras = obj.ras.concat(
                            paragraph.concat(element, "</p>")
                        );
                    });
                    return obj;
                }
                obj.ras = obj.ras.concat(strline);
            }
            return obj;
        } else {
            ok = false;
            if (JSON.stringify(obj) !== JSON.stringify(exemplu))
                test.push(JSON.parse(JSON.stringify(obj)));
            obj.enunt = "";
            obj.ras = "";
            index = re3.exec(strline);
            if (!index) {
                verif = strline;
            } else {
                index = index.toString().length + index.index;
                verif = strline.substring(index);
            }
            obj.enunt = obj.enunt.concat(verif);
        }
    }
    return obj;
}
function parse(string) {
    let line, strline;
    let flashcard = Object.assign({}, exemplu);
    do {
        line = re.exec(string);
        if (!line) return;
        strline = line.toString();
        flashcard = parseQ(strline, flashcard);
    } while (line);
}
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
router.post("/api", async (req, res) => {
    let id = parseInt(req.body.id);
    if (!id) id = 1;
    exemplu.pachet = id;
    parse(req.body.text.concat("\n 1"));
    const csv = new ObjectsToCsv(test);
    let nume = req.body.nume;
    if (!nume) nume = "list";

    let bom = "\ufeff";
    let csvcontent = await csv.toString();
    csvcontent = bom.concat(csvcontent);
    res.set({
        "Content-Disposition": "attachment; filename=" + nume + ".csv",
        "Content-type": "text/csv",
    });
    res.send(csvcontent);

    test = [];
    ok = 2;
});
app.use("/.netlify/functions/server", router); // path must route to lambda
app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));
module.exports = app;
module.exports.handler = serverless(app);
