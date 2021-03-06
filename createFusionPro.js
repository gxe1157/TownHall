// exports = module.exports;
// Evelio Velez Jr.  Oct 21 2016 10:47pm
var spacer = function(){
   for( var i = 0; i<12; i++)
        console.log('_');
}

module.exports = function(data, res) {
    //console.log('Prg: csvImport - data: ',data);
    var fs = require("fs");
    var pdfSlipSheets  = require("./pdfSlipSheets");
    var userTable = data.workOrder;

    /* Init sqlite3 */
    var GVM = res.locals;
    var db = new GVM.dbSqlite3.Database(GVM.sqlFileName);
    var sqlModel  = require('./sqlModel');
    sqlModel.init( userTable, GVM.sqlFileName);

    var start = Date.now();
    var updateDealerStatus = [];
    var updateSqlFile = [];

    /* printTown from script.js */
    var printFiles = data.printData.split(",");
    var workOrder  = data.workOrder;
    var dealerCode = data.dealerCode;
    var jobDir     = data.jobDir;

    var today   =  GVM.getDate();
    var dirName = __dirname.split('\\').join('\\\\');
    // var selectedFileName = data.selectedFileName;

    /* path to sqlite3 dbf */
    var myPath    = `./dataSource/${workOrder}/${dealerCode}/${jobDir}`;
    /* read directory */
    var getFiles  = require("./dirFiles");
    var objProduct = {};
    var objHomeOwners = {};

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
        todayIs = todayIs.length== 7 ? '0'+todayIs.substr(0,7) : todayIs;
        return todayIs.slice(4,8)+'-'+timeNow;
    }

    var dateParams = function(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) dd='0'+dd;
        if(mm<10) mm='0'+mm;
        todayIs = yyyy.toString()+mm.toString()+dd.toString();

        // var todayIs = d.toLocaleDateString().replace(/\/+/g, '');
        var timeNow = today.toTimeString().slice(0, 8).split(':', 3).join(' ').replace(/\s+/g, '-'); ;
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

    var writeToFile = function( oProduct, oCount, RecNo, idNum, expireMess, njHomeOwners ){
        var stdOut, N1, N2;

        if( dealerCode.toUpperCase() == '_NEWJERSEY' )
            [ N1, N2 ] = njHomeOwners.replace(/\s+/g, '').split('_');

        var array = objProduct[oProduct];
        var data  = ({ code      : oProduct,
                        promoType : joinLines(jobDir,1),
                        town      : objProduct[oProduct][0],
                        printDate : today,
                        workOrder : workOrder,
                        printTotal: `${oCount} sets | ${array.length} cards`,
                        fileOutput: `${oProduct}-${jobDir}-SS.pdf`
                    });
                    // console.log('data',data);

        for ( var x = 0; x < oCount; x++ ){
            // console.log(x, 'array', array,'dealerId',dealerId );
            if( x == 0 ){
                file.write( `Slip Sht, ${oProduct},${ data.fileOutput},,,,,${dirName},dataSource,${workOrder},${dealerCode},${jobDir}\n`);
                var pdf_HO_info = null;
                if( dealerCode.toUpperCase() == '_NEWJERSEY' && N1 !='' ){
                  pdf_HO_info = N1+'|'+N2+'|'+objHomeOwners[N1].length;
                  console.log('** pdf_HO_info', pdf_HO_info);
                }

                pdfSlipSheets(data, myPath, idNum, pdf_HO_info );
            }

            for ( var i = 0; i < array.length; i++){
                stdOut =`${x+1}, ${oProduct}, ${array[i]}, workOrder, jobTitle, ${today}, ${expireMess},${dirName},dataSource,${workOrder},${dealerCode},${jobDir}\n`;
                file.write(stdOut);
                // stdOut =`${x+1}, ${oProduct}, ${array[i]}`;
                // console.log('**sets: ',stdOut);
            }

            /* One set after each cert set */
            // if( dealerCode.toUpperCase() == '_NEWJERSEY' && x < N2 ){ // New Home Owners
            //     var cnt = 1;
            //     cnt++;
            //     for ( var h = 0; h < objHomeOwners[N1].length; h++){
            //         // stdOut =`${cnt+1}, ${oProduct}, ${objHomeOwners[N1][h]}.pdf, workOrder, jobTitle, ${today}, ${expireMess},${dirName},dataSource,${workOrder},${dealerCode},${jobDir}\\\\home_owners\n`;
            //         stdOut =`${cnt+1}, ${oProduct}, ${objHomeOwners[N1][h]}.pdf`;
            //         console.log(stdOut);
            //         // file.write(stdOut);
            //     }
            // }
        }

        /* Run all sets at the end */
        if( dealerCode.toUpperCase() == '_NEWJERSEY' && N1 !='' ){ // New Home Owners
          for ( var x = 0; x < N2; x++ ){
            for ( var h = 0; h < objHomeOwners[N1].length; h++){
                stdOut =`${x+1}, ${oProduct}, ${objHomeOwners[N1][h]}, workOrder, jobTitle, ${today}, ${expireMess},${dirName},dataSource,${workOrder},${dealerCode},${jobDir}\\\\HO\n`;
                file.write(stdOut);
                // stdOut =`${x+1}, ${oProduct}, ${objHomeOwners[N1][h]}`;
                // console.log(stdOut);

            }
          }
        }

    }

    /* ------------------- */
    /* Begin main app here */
    objProduct   = getFiles(myPath);
    objHomeOwners = getFiles(`${myPath}/HO`);
    /* Write to file */
    // if (!isDirSync(`${myPath}/done`)) {
    //    fs.mkdirSync(`${myPath}/done`);
    // }

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
           tempVar.length == 1 ? idNum.push(tempVar[0].toString() ) : idNum.push(tempVar[2].toString() );
        });

        printFiles.forEach(function(entry) {
            printStatus = 'PDF Not Found';
            var [ dealerId, setCount,printed,nofiles, respIndex, RecNo, expireMess, njHomeOwners ] = entry.split('|');
            dealerId = dealerId.toUpperCase().replace(/\s+/g, '');
            /* Check to see if PDF property exixt in object of directory list*/
            if(objProduct.hasOwnProperty(dealerId)){
               // console.log("Processing.......... "+ dealerId+" | "+setCount, expireMess);
               /* write to csv file */
               writeToFile( dealerId, setCount, RecNo, idNum, expireMess, njHomeOwners );
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
