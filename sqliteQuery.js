//exports = module.exports = runQuery;
// Evelio Velez Jr.   12-25-2016

module.exports = function(req, res) {
  // console.log('========================================================');
  // console.log('Prg: sqliteQuery - sqlRequest: ',sqlRequest, '\n\n\nParams',req.params,'\n\n\nBody',req.body);
  // console.log('========================================================');

  /* Global functions */
  var GVM = res.locals;

  var sqlRequest = GVM.isObjEmpty( req.params ) ? req.body: req.params;
  var pathDir  = sqlRequest.jobDir;
  var myPath   = `./dataSource/${sqlRequest.workOrder}/${sqlRequest.dealerCode}/${pathDir}`;
  var arrJobDir  = sqlRequest.allJobDir.split(",") ;
  var userTable = sqlRequest.workOrder;
  var str = sqlRequest.query != undefined ? sqlRequest.query : '';

  if( sqlRequest.radioGroupBy == undefined )  sqlRequest.radioGroupBy = 'None';
  if( str.indexOf( 'Completed' ) != -1 ){
      str = GVM.removeSpaces(str);
      var [ caseOpt, caseData ] = str.split(':');
  } else {
     var caseOpt = sqlRequest.query;
  }


  /* Init SQLite3 */
  var sqlModel  = require('./sqlModel');
  sqlModel.init( userTable, GVM.sqlFileName);

  /* Init var */
  var rowData   = [], fld = [];
  var rowLength = 0;
  var qStmnt, pStmnt, updtStmnt, key;

  qStmnt =`SELECT * FROM ${userTable} where `;
  qStmnt +=`DealerCode = '${sqlRequest.dealerCode}' and
            PromoType  ='${pathDir}' `;

  switch ( caseOpt ){
    case 'SD2':
      /* Open Items */
      qStmnt +=`and PrintCount = 0 and Count > 0 and NoFiles > 0`;
      break;

    case 'SD3':
      /* Printed Items  */
      qStmnt +=`and PrintCount > 0`;
      break;

    case 'SD4':
      /* Files Not Found */
      qStmnt +=`and Count > 0 and NoFiles = 0`;
      break;

    case 'SD5':
      /* Files Not Mailing */
      qStmnt +=`and Count = 0 and NoFiles = 0`;
      break;

    case 'Completed':
      qStmnt +=`and BatchNo = '${caseData}'`;
      break;

  }


  /* Read directory */
  var getFiles   = require('./dirFiles');
  var oFileNames = getFiles(myPath);

  var updateSQL = function( rowData, rowLength ){
    var printed;
    var updateSqlFile = [];
    for ( var i = 0; i < rowLength; i++) {
      /* Update using field Dcode */

      printed = rowData[i]['PrintCount'];
      if( printed == 0 ){
          /* read oFileNames[ key ] dir and update sql with noFiles */
          if( rowData[i]['expireMessage'] == null )  rowData[i]['expireMessage'] = '';
          key = rowData[i]['Dcode'].trim().toUpperCase();
          // if( key == 'ALLENDALE') console.log('file:',key, oFileNames[ key ]);
          // if( key == 'ALLENDALE') console.log('file:',key, oFileNames);

          rowData[i]['NoFiles'] = oFileNames[ key ] !== undefined ? oFileNames[ key ].length : 0;
          rowData[i]['Status']  = rowData[i]['Count'] > 0 ? rowData[i]['NoFiles'] > 0 ? `.... ${ rowData[i]['expireMessage'] }` : 'File not found' : 'No mailing';
          rowData[i]['ModDate'] = GVM.getDate();

          updateSqlFile.push(`${rowData[i]['NoFiles']} | ${rowData[i]['Status']} | ${rowData[i]['ModDate']} | ${rowData[i]['RecNo']}`);
      }
    }

    var fldnames = ['NoFiles', 'Status', 'ModDate'];
    sqlModel.update( updateSqlFile, fldnames );
  }

  var start = Date.now();
  // console.log("Sqlite Query Start processing...."+qStmnt);

  if( sqlRequest.mode == 'sqlUpdate' ){
      var data=[], flds=[], buildData='';
      /* Update edited records */
      if( sqlRequest['Dcode'] !== undefined && (sqlRequest.sqlDcode !== sqlRequest.Dcode) ){
          var dcode = sqlRequest['Dcode'].toUpperCase();
          flds.push('Dcode');
          buildData = ( `${sqlRequest.Dcode}|` );
      }

      // console.log( sqlRequest.reprint, sqlRequest.count);

      flds.push('Reprint','Count');
      buildData +=`${sqlRequest.reprint}|${sqlRequest.count}|${sqlRequest.recNo}`;
      data.push( buildData );
      sqlModel.update( data, flds);
  }

  var db = new GVM.dbSqlite3.Database(GVM.sqlFileName);
  db.serialize(function() {
      db.all(qStmnt, function(err, row) {
          if(err){
            console.log(err);
            return err;
      	  }
          rowData   = row;
          rowLength = row.length;
          updateSQL( rowData, rowLength );
      });
  }); // End db.serialize

  db.close(function() {
    console.log( 'Sqlite: '+sqlRequest.output+' | ',"Sqlite Query is complete: "+ (Date.now() - start)/1000 + " : sec" + " Total Records: " + rowLength);
    switch( sqlRequest.output ) {

        case 'fromPostToScreen':
          res.header("Cache-Control", "no-cache, no-store, must-revalidate");
          res.header("Pragma", "no-cache");
          res.header("Expires", 0);
          res.redirect('/townHall/all/screen/'+sqlRequest.workOrder+'/'+sqlRequest.dealerCode+'/'+sqlRequest.jobDir+'/'+arrJobDir.toString());
          break;

        case 'screen':
            // console.log('rowData',rowData);
            // var arrJobDir = sqlRequest.jobDir.split(",");

            res.render('displayTowns', {
              title: 'Town Hall Dealer Packs',
              jobDirSelected: pathDir,
              allJobDir : sqlRequest.allJobDir,
              workOrder : sqlRequest.workOrder,
              dealerCode: sqlRequest.dealerCode,
              jobDir    : arrJobDir,
              rowData   : rowData,
              rowLength : rowLength,
              groupBy   : sqlRequest['dealerCode'].toUpperCase() == '_NEWJERSEY' ? true : false
            });
            break;

        default:
          // console.log('_____________________________________');
          res.send(rowData);
    }
  }); // End db.close

} //runQuery
