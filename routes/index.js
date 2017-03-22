//Evelio Velez Jr. 11.8.16

var dd = function(opt, req, data){
    for( var i = 0; i<12; i++)
        console.log('_');

    console.log(`${opt}--------------------------------`);
    console.log('Body',req.body);
    console.log('Params',req.params);
    if(data != undefined ) console.log('Data',data);
    console.log('---------------------------------------');
}

exports.home = function(req,res){
    res.render('homePage', {
    	title  : 'Town Hall Dealer Packs',
    });
};

exports.pageProcess  = function(req,res){
    // dd('pageProcess', req, req.params, null );
    var pageRedirect = req.body.URL;
    var user_name    = req.body.user_name;
    var mode         = req.body.mode;

    var dirList  = require('../dirList');
    var [ allWorkOrders, workOrders ] = dirList(res);

    /* redirect to var pageRedirect */
    res.render( pageRedirect, {
        title     : 'Town Hall Dealer Packs',
        user_name :  user_name,
        workOrder :  workOrders,
        dc        :  allWorkOrders,
        mode      :  mode
    });
};

exports.editData = function(req,res){
    // dd('editData', req, req.params, null );

    var GVM = res.locals;
    /* Init sqlite3 */
    var db = new GVM.dbSqlite3.Database(GVM.sqlFileName);
    var userTable = req.params['workOrder'];
    var recNo     = req.params['recNo'];
    var allJobDir = req.params['allJobDir'];

    db.serialize(function() {
        var qStmnt =`SELECT * FROM ${userTable} where RecNo ='${recNo}'`;
        db.all(qStmnt, function(err, row) {
            if(err){
              console.log(err);
              return err;
              }
            rowData = row;
         });

    }); // End db.serialize

    db.close(function() {
        var reprint = rowData[0]['Reprint'] !== undefined ? rowData[0]['Reprint'] : 0;
        var count   = rowData[0]['Count'] !== undefined ? rowData[0]['Count'] : 0;

            res.render('editData', {
                title     : 'Town Hall Dealer Edit Data',
                recNo     : rowData[0]['RecNo'],
                allJobDir : req.params['allJobDir'],
                Dcode     : rowData[0]['Dcode'],
                Status    : rowData[0]['Status'],
                workOrder : rowData[0]['WorkOrder'],
                dealerCode: rowData[0]['DealerCode'],
                jobDir    : rowData[0]['PromoType'],
                reprint   : reprint,
                count     : count
            });
    }); // End db.close

};

exports.isFileImported = function(req, res ){
    var importData = require('../isImported');
    var data = req.params;

    importData( res, data)
        .then(function( results ) { // records found
          res.send( true );
        })
        .catch(function( results ) {
          res.send( false );
        })
};

exports.getOrder = function(req,res){
    var csvImport  = require('../csvImport');
    var importData = require('../isImported');

  	var data = ({ selectedFileName	: req.body.csvFile,
                  dealerCode : req.body.dealerCode,
                  jobDir	 : req.body.jobDir,
                  workOrder  : req.body.workOrder,
                  allJobDir  : req.body.allJobDir,
                  mode       : req.body.mode
  			    });

    /* Import then re-direct to runQuery */
    importData( res, data)
        .then(function( results ) {
            res.redirect('/townHall/all/screen/'+data.workOrder+'/'+data.dealerCode+'/'+data.jobDir+'/'+data.allJobDir);
        })
        .catch(function( results ) {
            csvImport(res, data);
        })
};


exports.runQuery = function(req, res) {
    var myQuery = require('../sqliteQuery');

    /* Run Query then re-direct to output */
    myQuery(req, res);
};

exports.reportPDF = function(req, res) {
    var importData = require('../isImported');

    /* Import then re-direct to runQuery */
    importData( res, req.params )
        .then(function( results ) {
            if( req.params['query'] == 'SD7' )
                var pdfReport = require('../pdfCheckList');
            else
                var pdfReport = require('../pdfReport');

            pdfReport(req, res);
        })
        .catch(function( results ) {
            res.send( `File not found` );
        })
};

exports.getTownData = function(req,res){
    res.render('getTownInfo', {
        title     : 'Town Hall Dealer Add Town',
        allJobDir : req.params['allJobDir'],
        workOrder : req.params['workOrder'],
        jobDir    : req.params['jobDirSelected'],
        dealerCode: req.params['dealerCode'],
        newDealerCode: req.params['newDealerCode']
    });
}

exports.dropFromTable = function(req, res) {
    var [ sqlRequest, sqlModel, GVM ] = require('./sqlSetup')(req, res);
    // dd(sqlRequest.mode, req, null);

    sqlModel.findById( 'RecNo', sqlRequest.RecNo1 )
        .then(function( results ) { // records found
            // console.log('Results ....', results );
            let datasource = results[0].DataSource;
            let fldnames   = 'DataSource';

            // dd( 'DropFromtables', req, null);
            var sqlRequest = ({ selectedFileName  : null,
                          dealerCode : req.body.dealerCode,
                          jobDir     : req.body.jobDir,
                          workOrder  : req.body.workOrder,
                          allJobDir  : req.body.allJobDir,
                          jobDirSelected  : req.body.jobDirSelected,
                          output     :  'fromPostToScreen'
                        });

            sqlModel.delete( datasource, fldnames );
            res.redirect('/townHall/all/'+sqlRequest.output+'/'+sqlRequest.workOrder+'/'+sqlRequest.dealerCode+'/'+sqlRequest.jobDirSelected+'/'+sqlRequest.allJobDir );
        })
        .catch(function( results ) {
            console.log('Failed ....',  results );
            process.exit(1);
        })
};


exports.addRemoveTown = function(req, res) {
    var [ sqlRequest, sqlModel, GVM ] = require('./sqlSetup')(req, res);
    // dd(sqlRequest.mode, req, null);

    if( sqlRequest.mode == 'addTown' ) {
        /* Add Town To List with one insert for each promo type */
        var dataUpdate =[];
        var allDir = sqlRequest['allJobDir'].split(',');

        for(var i = 0; i < allDir.length; i++)
            dataUpdate.push( `null|${sqlRequest.dcode}|${sqlRequest.city}|${sqlRequest.zip}|${sqlRequest.count}|${sqlRequest.workOrder}|${sqlRequest.dealerCode}|user|0|${allDir[i]}|....|${GVM.getDate()}|0|0|||${GVM.getDate()}`);

        sqlModel.insert( dataUpdate );
    }
    else{
        var fldnames   = 'RecNo';
        var dataUpdate = sqlRequest.recNo;
        sqlModel.delete( dataUpdate, fldnames );
    }

    res.redirect('/townHall/all/'+sqlRequest.output+'/'+sqlRequest.workOrder+'/'+sqlRequest.dealerCode+'/'+sqlRequest.jobDir+'/'+sqlRequest.allJobDir );
};


exports.expireMessage = function(req, res) {
    var [ sqlRequest, sqlModel, GVM  ] = require('./sqlSetup')(req, res);

    var fldnames   = ['expireMessage'];

    var dataUpdate = sqlRequest['updateData'].split(',');
    sqlModel.update( dataUpdate, fldnames );
    res.send(dataUpdate.toString() );
};

exports.doReverse = function(req, res) {
    var [ sqlRequest, sqlModel, GVM  ] = require('./sqlSetup')(req, res);

    var updateDealerStatus = [];
    var updateSqlFile = [];
    var deletePDF_SS  = [];

    var sqlUpdate = function( data ) {
        /* read req params and update sql */
        var fs = require('fs');
        var cnt = 0;
        var printFiles = data.printData.split(",");

        printFiles.forEach(function(entry) {
            var [ findProduct, setCount,printed,nofiles, respIndex, RecNo ] = entry.split('|');
            deletePDF_SS.push(`${findProduct.trim()}-${data.jobDir}-SS.pdf`);
            updateSqlFile.push(`....|${ GVM.getDate()}|0|0| |${RecNo}`);
            updateDealerStatus.push(`....| ${ GVM.getDate()} | 0 | 0 |${respIndex}|${RecNo}|${findProduct}`);
        });

        deletePDF_SS.forEach(function(entry) {
            fs.unlink(`./datasource/${data.workOrder}/${data.dealerCode}/${data.jobDir}/${entry}`, (err) => {
              if (err) console.log( 'error: '+entry+' | ', err);
            });
        });

        var flds = ['Status', 'ModDate', 'Reprint', 'PrintCount', 'BatchNo '];
        sqlModel.update( updateSqlFile, flds);
        res.send( updateDealerStatus.toString() );
    }

    sqlUpdate(sqlRequest);
};

exports.fusionProOutput = function(req, res) {
    var createFusionPro = require('../createFusionPro');
    createFusionPro(req.params, res);
};

exports.pdfBrowser = function(req, res) {
    var fs = require('fs');

    var tempFile= `./lib/pdfout/${ req.params['pdfName'] }`;
    fs.readFile(tempFile, function (err,data){
        res.contentType("application/pdf");
        res.end(data);
    });
}

exports.getStatusData = function(req, res) {
    var fs = require('fs');
    var [ sqlRequest, sqlModel, GVM ] = require('./sqlSetup')(req, res);

    var userTable = req.params['woDir'];
    qStmnt =`SELECT WorkOrder, Dealercode, count, printCount, ( printCount - count) as val FROM ${userTable} group by dealercode`;

    sqlModel.select( qStmnt, userTable, GVM )
        .then(function( results ) { // records found
            res.contentType("application/JSON");
            res.end( JSON.stringify(results) );
        })
        .catch(function( results ) {
            res.contentType("application/JSON");          
            res.end("SQL not FOUND");
            // process.exit(1);
        });
}

// Route for all other page requests
exports.notFound = function(req, res) {
  	res.end("Page not found............... ");
};
