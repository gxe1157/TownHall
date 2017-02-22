// exports = module.exports;
// Evelio Velez Jr.  Oct 21 2016 10:47pm
var spacer = function(){
   for( var i = 0; i<12; i++)
        console.log('_');
}

module.exports = function(data, res) {
    // console.log('Prg: csvImport - data: ',data);
    var fs = require("fs");
    var pdfSlipSheets  = require("./pdfSlipSheets");
    var userTable = data.workOrder;

    /* Init sqlite3 */
    var GVM = res.locals;
    var db = new GVM.dbSqlite3.Database(GVM.sqlFileName);
    var sqlModel  = require('./sqlModel');
    sqlModel.init( userTable, GVM.sqlFileName);

    // console.log('Prg:19 ceateFusionPro:....', data);

    var start = Date.now();
    var updateDealerStatus = [];
    var updateSqlFile = [];

    /* printTown from script.js */
    var printFiles = data.printData.split(",");
    var workOrder  = data.workOrder;
    var dealerCode = data.dealerCode;
    var jobDir     = data.jobDir;
    // var selectedFileName = data.selectedFileName;

    /* path to sqlite3 dbf */
    var myPath    = `./dataSource/${workOrder}/${dealerCode}/${jobDir}`;
    /* read directory */
    var getFiles  = require("./dirFiles");
    var objProduct = {};
    var writeRecordCount = 0;

    var isDirSync = function(aPath) {
      try {
        return fs.statSync(aPath).isDirectory();
      } catch (e) {
        if (e.code === 'ENOENT') {
          return false;
        } else {
          throw e;
        }
      }
    }

    var timeStamp = function(){
        var [ todayIs, timeNow ] = dateParams();
        return  todayIs+'-'+timeNow;
    }

    var batchNo = function(){
        var [ todayIs, timeNow ] = dateParams();
        return todayIs.slice(0,4)+'-'+timeNow;
    }

    var dateParams = function(){
        var d = new Date();
        /* deconstruct array */
        var todayIs = d.toLocaleDateString().replace(/\/+/g, '');
        var timeNow = d.toTimeString().slice(0, 8).split(':', 3).join(' ').replace(/\s+/g, '-'); ;
        return [ todayIs, timeNow ];
    }

    var moveFiles = function(fileName){
        fs.rename( `${myPath}/${fileName}`, `${myPath}/done/${fileName}`, function (err) {
          if (err) throw err;
          fs.stat(`${myPath}/done/${fileName}`, function (err, stats) {
            if (err) throw err;
            // console.log('stats: ' + JSON.stringify(stats));
          });
        });
    }

    var joinLines = function( ln, x ){
         return ln.split('-', x).join(' ').replace(/\s+/g, '-');
    }

    var writeToFile = function( oProduct, oCount, RecNo, idNum ){
        var stdOut, fileName;
        var array      = objProduct[oProduct];
        var today      =  GVM.getDate();
        var tempArray  = objProduct[oProduct];


        if( dealerCode.toUpperCase() == '_NEWJERSEY'){
            var code       = joinLines(tempArray[0],2);
            var promoType  = tempArray[0].replace(`${code}-`, '').split('-',1).toString();

            var data   = ({ code      : code,
                            promoType : jobDir,
                            town      : idNum.toString(),
                            printDate : today,
                            workOrder : workOrder,
                            printTotal: `${oCount} sets | ${array.length} cards`,
                            fileOutput: `${code}-${promoType}-SS.pdf`
                         });
                        // console.log('data',data);
        }
        else{
            var code       = joinLines(tempArray[0],3);
            var promoType  = tempArray[0].replace(`${code}-`, '').split('-',1).toString();
            var [ a, town] = tempArray[0].split(`${code}-${promoType}-`);

            var data   = ({ code      : code,
                            promoType : promoType,
                            town      : town,
                            printDate : today,
                            workOrder : workOrder,
                            printTotal: `${oCount} sets | ${array.length} cards`,
                            fileOutput: `${code}-${promoType}.pdf`
                         });
        }

        sqlModel.findById( 'RecNo', RecNo )
            .then(function( results ) { // records found
                // console.log('Results ....', results );
                let expireMess = results[0].expireMessage;
                let dirName = __dirname.split('\\').join('\\\\');
                //  "C:\\Users\\fsm\\Express\\TownHall\\dataSource\\Mar2017\\CDS-132\\GUIDES-CDS-132";

                for ( var x = 0; x < oCount; x++ ){
                    // console.log(x, 'array', array,'dealerId',dealerId );
                    if( x == 0 ){
                        file.write( `Slip Sht, ${oProduct},${ data.fileOutput},,,,,${dirName},dataSource,${workOrder},${dealerCode},${jobDir}\n`);
                        pdfSlipSheets(data, myPath, idNum);
                    }

                    for ( var i = 0; i < array.length; i++){
                        stdOut =`${x+1}, ${oProduct}, ${array[i]}, workOrder, jobTitle, ${today}, ${expireMess},${dirName},dataSource,${workOrder},${dealerCode},${jobDir}\n`;
                        // console.log('**sets: ',stdOut);
                        file.write(stdOut);
                        /* Move first occurance of files to done sub directory */
                        // if( x == 0 ) moveFiles(array[i]);
                    }
                }

            })
            .catch(function( results ) {
                console.log('Failed ....',  results );
                process.exit(1);
            })
    }

    /* ------------------- */
    /* Begin main app here */
    // dd('getOrder', req, null);
    objProduct = getFiles(myPath);
    // console.log('objProduct', Object.keys(objProduct));

    /* Write to file */
    if (!isDirSync(`${myPath}/done`)) {
       fs.mkdirSync(`${myPath}/done`);
    }

    /* Create fusionpro output file */
    var outPutFile  = `${__dirname}/lib/output_data/${jobDir}-${timeStamp()}.csv`;
    var batchNumber = batchNo();

    var file   = fs.createWriteStream(outPutFile);

    file.on('error', function(err) { /* error handling */
        console.log('ln: 138','Problem with opening file: ',outPutFile );
    });

        /* array printFiles sent from script.js */
        var header = 'count, objProduct, fileName, jobNo, jobTitle, date, expireMess,filePath,dataSource,workOrd,jobDir,promoType\n';
        file.write( header );

        var idNum =[], tempVar;
        printFiles.forEach(function(entry) {
           tempVar = entry.split('|',1).toString().trim().split('-');
           tempVar.length == 1 ? idNum.push(tempVar[0]) : idNum.push(tempVar[2]);
        });
        // console.log('idNum', idNum.toString());

        printFiles.forEach(function(entry) {

            printStatus = 'PDF Not Found';
            var [ dealerId, setCount,printed,nofiles, respIndex, RecNo ] = entry.split('|');
            dealerId = dealerId.toUpperCase().replace(/\s+/g, '');
            /* Check to see if PDF property exixt in object of directory list*/
            if(objProduct.hasOwnProperty(dealerId)){
               // console.log("Processing.......... "+ dealerId+" | "+setCount);
               /* write to csv file */
               writeToFile( dealerId, setCount, RecNo, idNum );
               var printCount = +setCount + +printed;
               updateSqlFile.push(`Completed :${batchNumber}|${ GVM.getDate()}|0|${printCount}|${batchNumber}|${RecNo}`);
               updateDealerStatus.push(`Completed :${batchNumber} | ${ GVM.getDate()} | 0 |${printCount} | ${respIndex}|${RecNo}|${dealerId}`);
            } else {
               console.log( printStatus+".... "+ dealerId+" | "+objProduct[dealerId]);
            }

        });

    var flds = ['Status', 'ModDate', 'Reprint', 'PrintCount', 'BatchNo '];
    sqlModel.update( updateSqlFile, flds);

    res.send( updateDealerStatus.toString() );

} // End module.exports
