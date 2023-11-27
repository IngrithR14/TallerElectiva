var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var reload = require('reload');
var moment = require('moment-timezone');
var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var jsonFilePath = path.join(__dirname, 'data', 'registros.json');

function crearArchivoDeRegistros() {
    fs.access(jsonFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log("El archivo no existe. Creándolo...");
            var dirPath = path.dirname(jsonFilePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
            }
            fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2), 'utf-8');
        }
    });
}

app.post('/agregarRegistro', function (req, res) {
    var nuevoRegistro = req.body;
    fs.readFile(jsonFilePath, 'utf8', function (err, data) {
        if (err) {
            console.error(err);
            crearArchivoDeRegistros();
        } else {
            var registros = JSON.parse(data);
            registros.push(nuevoRegistro);
            fs.writeFile(jsonFilePath, JSON.stringify(registros, null, 2), function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error al guardar el registro');
                } else {
                    res.send('Registro agregado con éxito');
                }
            });
        }
    });
});

app.get('/', function (req, res) {
    fs.readFile(jsonFilePath, 'utf8', function (err, data) {
        if (err) {
            console.error(err);
            crearArchivoDeRegistros();
        } else {
            var registros = JSON.parse(data);

            registros.sort((a, b) => new Date(b.date) - new Date(a.date));
            registros.forEach(registro => {
                registro.date = moment(registro.date)
                    .tz('America/Bogota')
                    .format('DD/MM/YYYY, h:mm:ss a');
            });
            var total = registros.reduce((acc, registro) => {
                return registro.type === 'income' ? acc + parseFloat(registro.amount) : acc - parseFloat(registro.amount);
            }, 0);

            res.render('paginas/index', { registros: registros, total: total.toFixed(2) });
        }
    });
});


app.get('/acercade', function (req, res) {
    res.render('paginas/acercade');
});

app.listen(8080);
reload(app);
console.log('El servidor esta corriendo en el puerto 8080');