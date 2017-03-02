// Evelio Velez Jr.  Nov 8, 2016

//Server dependencies
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var routes = require('./routes');

// Init vars
var app = express();

// locals variable
var localGlobals = require('./globalVarMiddleware');
app.use(localGlobals.myHelpers);

var PORT = process.env.PORT || 3000;
var http = require('http').Server(app);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json())

// View engine setup and static assets from the public folder
// app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({extname: 'hbs', defaultLayout:'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');

var hbs = require('handlebars');
hbs.registerHelper("inc", function(value, options){
    return parseInt(value) + 1;
});

hbs.registerHelper("isdisabled", function(value, options){
    if( value.substr(0,9) == 'Completed' ) return "disabled";
});

hbs.registerHelper("isReprint", function(value, options){
    if( value.substr(0,9) !== 'Completed' ) return "disabled";
});

hbs.registerHelper("dateFromat", function(value, options){
    return value.substr(0,5);
});


app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.get('/', routes.home);

app.get('/home', routes.home);

app.post('/home', routes.home);

app.post('/pageProcess', routes.pageProcess);

app.post('/getOrder', routes.getOrder);

app.post('/displayTowns', routes.runQuery);

app.post('/addRemoveTown', routes.addRemoveTown);

app.post('/getReport', routes.runQuery);

app.post('/dropTable', routes.dropFromTable);

app.get('/queryData/:mode/:selectedFileName/:workOrder/:dealerCode/:jobDir?', routes.isFileImported);

app.get('/queryData/:mode/:selectedFileName/:workOrder?', routes.isFileImported);

app.get('/editData/:recNo/:allJobDir/:workOrder', routes.editData);

app.get('/getTownData/:newDealerCode/:jobDirSelected/:dealerCode/:allJobDir/:workOrder', routes.getTownData);

app.get('/townHall/:query/:output/:workOrder/:dealerCode/:jobDir/:allJobDir?', routes.runQuery);

app.get('/report/:query/:output/:workOrder/:dealerCode/:mode?', routes.reportPDF);

app.get('/expireMessage/:workOrder/:updateData?', routes.expireMessage);

app.get('/fusionPro/:workOrder/:dealerCode/:jobDir/:printData?', routes.fusionProOutput);

app.get('/doReverse/:workOrder/:dealerCode/:jobDir/:printData?', routes.doReverse);

app.get('/lib/pdfout/:pdfName?', routes.pdfBrowser );

app.get('/lib/:woDir?', routes.getStatusData );

app.get('*', routes.notFound);

app.listen(PORT, function() {
    console.log('Server listening on ' + PORT);
});
