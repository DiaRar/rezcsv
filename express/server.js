const serverless = require('serverless-http')
const express = require('express')
const ObjectsToCsv = require('objects-to-csv')
require('console-stamp')(console, '[HH:MM:ss]');
const fs = require('fs');
var text = fs.readFileSync("../template.html", "utf-8");
const app = express()
const port = 5000
let ok = true;
const router = express.Router();
const exemplu = {
  activ: 1,
  pachet: 1,
  enunt: "",
  ras: ""
}

let test = [];
const re = /.+/g;
const paragraph = "<p>";
const re2 = /^([a-z][.])/m;
const re3 = /\d+[.][ ]?/;
function parseQ(strline, obj) {
  let a = re2.exec(strline)
  let index;
  let verif;
  if(a){
    // console.log(strline)
    strline = paragraph.concat(strline, "</p>")
      if(!ok){
        
        obj.enunt = obj.enunt.concat(strline)
        }
        else obj.ras = obj.ras.concat(strline);
        // console.log(obj.ras)
        return obj;
  } else {
    
    if(!ok){
      ok = true;
      // console.log("ok")
      if(strline.length > 4){
        let aux = strline.split(': ')[1]
        if(!aux) aux = strline.split(':')[1];
        if(aux===" ") return obj;
        strline=aux;
        a = re2.exec(strline)
        if(a){
          strline = strline.split(',');
          strline.forEach(element => {
            obj.ras = obj.ras.concat(paragraph.concat(element, "</p>"))
            // console.log(element);
          });
          return obj;
        }
        obj.ras = obj.ras.concat(strline);
      }
      return obj;
    } else{
      ok = false;
      if(JSON.stringify(obj)!==JSON.stringify(exemplu))
      test.push(JSON.parse(JSON.stringify(obj)));
      obj.enunt = '';
      obj.ras = ''
      index = re3.exec(strline);
      if(!index) {
        verif = strline;
      }else {
        // console.log(obj.ras)
        index = index.toString().length + index.index
        verif = strline.substring(index);}
      // console.log(obj);
      // console.log(test);
      // console.log(exemplu)
      
      obj.enunt = obj.enunt.concat(verif);
      
      // console.log(obj)
      // console.log(test)
    }
  }
  return obj;
}
function parse (string ) {
  let line, strline;
  let flashcard = Object.assign({},exemplu);
    do{
        line = re.exec(string);
        if(!line) return;
        strline = line.toString();
        // console.log(flashcard)
        // console.log(strline)
        flashcard = parseQ(strline, flashcard);
        // console.log(flashcard)
        // console.log(flashcard);
    } while(line)
}
app.use(express.urlencoded({ extended: true }));
router.post('/api', async (req, res) => {
  // await console.log(req.body.text)
  // console.log(req.body.text)
  let id = parseInt(req.body.id)
  if(!id) id = 1
  exemplu.pachet = id;
  parse(req.body.text.concat("\n 1"))
  // console.log(test)
  const csv = new ObjectsToCsv(test);
  let nume = req.body.nume
  if(!nume) nume = 'list';
  
  let csvcontent = await csv.toString();
  fs.writeFile('./csv/' + nume + '.csv', "\ufeff" + csvcontent, (err) => {
    if (err)
      throw err;
    console.log("The file was succesfully saved with UTF-8 with BOM!");
    res.download('./csv/' + nume + '.csv', nume + '.csv', function (err) {
      fs.unlink('./csv/' + nume + '.csv', function () {
        console.log("Deleted: " + nume);
      });
    });

  })
  
  // csv.toDisk('./csv/'+nume+'.csv', {append: false, bom: true})
  test = [];
  ok = 2;
  // await res.send('It works')
  // parse(`Hello \nworld sd`)
})
  router.get('/', (req, res) => {
     res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write("a");
    res.end();
});
//   app.use(express.static(__dirname + '/public'));
 app.use('/.netlify/functions/server', router);  // path must route to lambda

app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
module.exports = app;
module.exports.handler = serverless(app);
// app.listen(port,'192.168.0.60', () => {
//   console.log(`Example app listening at http://192.168.0.60:${port}`)
// })
