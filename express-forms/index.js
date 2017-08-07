let express = require('express'),
    pug = require('pug'),
    path = require('path');
let bodyParser = require('body-parser')

let app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
    res.render('index');
});

app.post('/', function(req, res) {
    res.render('landing', req.body);
});

app.listen(3000);
