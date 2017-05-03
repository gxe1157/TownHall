//exports = module.exports = runApp;
// Evelio Velez Jr.  Nov 21, 2016

module.exports = function (res, data) {
    // console.log('Prg: csvImport - data: ',data);
    var fs = require("fs");
    var GVM = res.locals;

    /*  Init sqlite3  */
    var db = new GVM.dbSqlite3.Database(GVM.sqlFileName);
    var userTable = data.workOrder;

    var start = Date.now();
    var delim = ",";
    var fldLength = 0;
    var newLines  = [];
    var arrjobDir = [];

    var selectedFileName = data.selectedFileName;
    var dealerCode = data.dealerCode;
    arrjobDir      = data.allJobDir.split(",");
    var jobDir     = arrjobDir[0];
    var workOrder  = data.workOrder;
    var fileImport =`./dataSource/${workOrder}/${dealerCode}/${selectedFileName}`;
    var myPath     =`./dataSource/${workOrder}/${dealerCode}`;


    var nhoImport =`./lib/sqlite/TH-Worksheet.csv`;
    var dataOut = {};

    fs.open('fileImport','r',function(err,fd){
        if (err && err.code=='ENOENT') { /* file doesn't exist */ }
    });



    // Read csv file
    var fileContents = fs.readFileSync(fileImport);
    var lines = fileContents.toString('utf8').split(/\r\n|[\n\r\u0085\u2028\u2029]/g);

    var dealerPacks = function(){
        var line = '', fixLine ='';
        var flds = [];
        var fileBegin = false;
        var charLocation = 0, firstPos = 0; lastPos = 0;

        var x = 0;
        for ( var i = 1; i < lines.length; i++) {
            line = lines[i];
            flds = line.split(delim);

            if( flds[0].toUpperCase() === 'CODE')
                fileBegin = true;

            /* If fileBegin = true and these 2 flds are not empty then save to newLine array */
            flds[0] = GVM.removeSpaces(flds[0]);
            if( fileBegin && flds[0].length > 0 && flds[3].length > 0 ){
                x++;
                charLocation = line.indexOf( '"' );
                if( charLocation != -1 ){
                    firstPos = line.indexOf( '"' );
                    lastPos = line.indexOf( '",' );
                    fixLine = line.substring(firstPos, lastPos ).replace(/[,"]/g, '');
                    line = line.substring(0,firstPos)+fixLine+line.substring(lastPos+1, line.length);
                }
                newLines.push( `${x},${line}` );
            }
        }

    }


    readFileAsync = function( nhoImport ) {
        return new Promise(function(resolve, reject) {

            fs.readFile( nhoImport,  function(err, data){
                var arrData = data.toString('utf8').split('\r\n');
                for ( var i = 0; i < arrData.length; i++) {
                      var [ key, value ] = arrData[i].toUpperCase().split(',');
                      dataOut[ key ] = value;
                }

                if (err) {
                    reject( err );
                } else {
                    resolve( dataOut );
                }
            });

        });

    }; // end reaFilesAsync

    var newJersey = function( nho ){
        let delim = '---';
        let line = '', code = '', city = '';
        let fileBegin = false;
        let x = 0, nextChar = 0; count = 0, n = 0;
        let flds = [];
        let chkLine = '';
        let newHomeOwners = 0;

        for ( var i = 1; i < lines.length; i++) {
            line='';
            chkLine = lines[i].trim();

            if( chkLine.indexOf( 'City' ) != -1 ) fileBegin = true;
            if( chkLine.indexOf( '\\NHO' ) != -1 ) newHomeOwners = GVM.removeSpaces( chkLine.substr( -4, 4 ) );

            if( chkLine.indexOf( delim ) != -1 && chkLine.search( delim ) != 0 ){
                if( delim == '---' ) {
                    /* exspand delim */
                    n = chkLine.search( delim )
                    delim = '';
                    do {
                        delim += '-';
                        nextChar++;
                    }
                    while( chkLine.substr( n + nextChar, 1 ) == '-' );
                }
                line = chkLine;
            }

            // If fileBegin = true and line is not empty then save to newLine array
            if( fileBegin && line.length > 0 ){
                x++;
                flds  = line.split(delim);
                hoc   = nho[ flds[0].trim() ]; // home owner cert - H01, H02 ....
                code  = GVM.removeSpaces( flds[0] );
                files  = '';
                count = GVM.removeSpaces( flds[1].substr( -4, 4 ) );
                newLines.push( `${x}, ${code}, ${hoc}_${newHomeOwners}, ${files}, ${count}` );
            }
        } // end for

        /* Create file of new jersey Cities csv format */
        let outPutFile  = `${myPath}/arrTown.csv`;
        var file   = fs.createWriteStream(outPutFile);

        file.on('error', function(err) { /* error handling */
            console.log('ln: 138','Problem with opening file: ',outPutFile );
        });

        for ( var i = 0; i < newLines.length; i++){
            stdOut =`${newLines[i]}\n`;
            file.write(stdOut);
        }

    }

    var setupSQL  = function( tableSchema ){
        // console.log('table: ',tableSchema);
        db.serialize(function() {
            db.run("begin transaction");
                /* if dbf does not exit */
                db.run("CREATE TABLE IF NOT EXISTS "+userTable +"("+tableSchema+")");
            db.run("commit");
        });
    }

    var importCSV = function(placeHolder){
        // csvToSql
        var line = '';
        var flds = [];
        for( var i =0; i<fldLength; i++ ) flds[i] = '';

        db.serialize(function() {
            var cnt = 0;

            db.run("begin transaction");

                var stmt = db.prepare("INSERT INTO "+userTable+" VALUES (" + placeHolder + ")");
                for( var j = 0; j< arrjobDir.length; j++ ){
                    // read dir and get noFiles and update flds
                    var key        = '';
                    var townTotal  = 0;
                    var dirFiles   = require('./dirFiles');
                    var startImport= dealerCode == '_NewJersey' ?  0 : 1;
                    var oFileNames = dirFiles( `${myPath}/${arrjobDir[j]}` );

                    for ( var i = startImport; i < newLines.length; i++) {
                        line = newLines[i];
                        // line = line.replace(/"\s*$/, "");
                        flds    = line.split(delim,5);
                        flds[0] = null;
                        flds[5] = workOrder;
                        flds[6] = dealerCode;
                        flds[7] = selectedFileName.toUpperCase();

                        /* Update no of files in dcode */
                        key = flds[1].toUpperCase();
                        flds[8] = oFileNames[ key ] !== undefined ? oFileNames[ key ].length : 0;
                        flds[9] = arrjobDir[j];

                        /* if flds[4] which is mail count > 0  and flds[8] > 0 then mail */
                        flds[10] = flds[4] > 0 ? flds[8] > 0 ? '....': 'File not found' : 'No mailing';
                        flds[12] = 0;
                        flds[13] = 0; //+flds[4] + +flds[12];

                        flds[fldLength-1] = GVM.getDate();
                        stmt.run(flds);

                    }
                }

            db.run("commit");

            db.close(function() {
              // Close create PDF
              stmt.finalize();
              console.log('processing end.......'+cnt);
              console.log("Import Sqlite3 is complete: "+ (Date.now() - start)/1000 + " : sec");
              // console.log('Prg: csvImport - /townHall/all/screen/'+'/'+dealerCode+'/'+jobDir);
              res.redirect('/townHall/all/screen/'+workOrder+'/'+dealerCode+'/'+jobDir+'/'+arrjobDir.toString());
            });
        });
    }

    var tableStructure = function(callback){
        // Field array of names setup manually
        var  fldNames = [];
        var fieldType = [];

        fldNames  = ['RecNo', 'Dcode', 'City', 'Zip', 'Count','WorkOrder','DealerCode','DataSource','NoFiles','PromoType','Status','ModDate','Reprint','PrintCount', 'BatchNo', 'expireMessage','CreateDate'];
        fieldType = ['INTEGER PRIMARY KEY', 'TEXT', 'TEXT', 'TEXT', 'INTEGER','TEXT','TEXT','TEXT','INTEGER','TEXT','TEXT','TEXT','INTEGER','INTEGER', 'TEXT', 'TEXT','TEXT'];

        var tableSchema = '';
        var placeHolder = '';

        fldLength = fldNames.length;
        for ( var i = 0; i < fldLength; i++) {
          if(i < fldLength-1){
            tableSchema +=  fldNames[i]+' '+fieldType[i]+', ';
            placeHolder += '?,';
          }else{
            tableSchema +=  fldNames[i]+' '+fieldType[i];
            placeHolder += '?';
          }
        }

        /* Create New table based on New WorkOrder */
        setupSQL( tableSchema );

        // console.log(tableSchema);
        callback( placeHolder );
    }

    if( dealerCode.toUpperCase() == '_NEWJERSEY'){
        readFileAsync(nhoImport)
            .then(function( results ) { // records found
                /* CREATE DIR IF NEEDED */
                if (!isDirSync(`${myPath}/home_owners`))
                    fs.mkdirSync(`${myPath}/home_owners`);
                console.log(`${myPath}/home_owners`);

                newJersey( results );
                tableStructure( importCSV );
            })
            .catch(function( results ) {
              console.log('New Jersey Import Failed............ ', results);
            });

    } else {
        dealerPacks();
        tableStructure( importCSV );
    }

}//End runApp
