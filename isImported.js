//exports = module.exports = runApp;
// Evelio Velez Jr.  Nov 30, 2016

module.exports = function ( res, data ) {
    var GVM = res.locals;

    // Init sqlite3
    var db = new GVM.dbSqlite3.Database(GVM.sqlFileName); 
    var userTable = data.workOrder;    
    var rowLength = 0;
    // console.log( 'data', data );

    return new Promise(function (resolve, reject) {

      /* Build sqlite3 stmt */
      var stmt =`SELECT * FROM ${userTable} where `;
      if( data.mode == 'updateOrder' ){ 
          stmt +=`WorkOrder = '${data.workOrder}' and 
                  DealerCode = '${data.dealerCode}' and 
                  PromoType  = '${data.jobDir}'`;

      } else if ( data.mode == 'runReports' ) {
          stmt +=`WorkOrder = '${data.workOrder}'`;
      } else {
          stmt +=`DataSource ='${data.selectedFileName}'`;
      }
    
      db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${userTable}'`, function(error, row) {
        if (row !== undefined) {
            // console.log(`table ${userTable} exists............ `);
            db.all(stmt, function(err, row) {
                if(err){
                  // console.log(err);
                  return err;
                }
                rowLength = row.length;
            });
        }else{
            console.log("table not exists.");
        }
      });

      db.close(function() {
        // console.log('rowLength..........', rowLength);
        // console.log('stmt', stmt);      
        // console.log('userTable', userTable);        

        if ( rowLength ) {
          resolve( rowLength )
        } else {
          reject( rowLength )
        }          
      });
    })
}
