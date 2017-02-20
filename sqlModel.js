// Update SQL with array of fields provided.
// Evelio Velez Jr.  01/01/2017

// var sqlDB = new sqlite3.Database('./abcd')
// var id_1;

// sqlDB.serialize(() => {
//     sqlDB.serialize(() => {
//         var n = 0;
//         sqlDB.each("SELECT * FROM Table23", function(err, row, i) {
//             let data = {
//                 type: row.TYPE,
//                 id: row.ID,
//                 place: row.Place
//             };
//             var id = data.id;
//             id_1 = id;
//         }, ()=> {

//             sqlDB.run("DELETE FROM Table23 WHERE id=(?)", id_1, function(err) {
//                 if(err){
//                     console.log(err)
//                 }
//                 else{
//                     console.log("Successful");
//                 }
//                 sqlDB.close();
//             });

//         });
//     });
// });


module.exports = function( ) {
    /* Module Globals */
    var dbSqlite3 = require('./node_modules/sqlite3').verbose();
    var userTable, db, sqlFileName;
    var setFlds, placeHolder;

    var init = function( tableName, sqlName ){
        sqlFileName = sqlName;
        userTable = tableName;
        return this;
    }

    var updateData = function( data, fldNames, debug){
        /* fldNames array is predifined manually */
        if( debug == 'Evelio' ) console.log('debug.........',data, fldNames, userTable);
        fldSetup(fldNames);
        updateInsertData( data, 'sqlUpdate');
    }

    var insertData = function( data ){
        var fldNames = [];
        db = new dbSqlite3.Database(sqlFileName);
        db.serialize(function() {
            /* read table names and push fldNames */
            db.each("PRAGMA table_info(" + userTable + ")", function(err, col){
                if(err) console.log(err);
                fldNames.push( col.name );
            });

            db.close(function() {
                /* Close create PDF */
                fldSetup(fldNames);
                updateInsertData( data, 'sqlInsert' );
            });
        }) // end serialize
    }

    var fldSetup = function( fldNames ){
        setFlds = ' SET ';
        placeHolder='';
        fldLength = fldNames.length;
        for(var i = 0; i < fldLength; i++) {
            if(i < fldLength-1){
               setFlds += fldNames[i]+' = ?, ';
               placeHolder += '?,';
            }else{
               setFlds += fldNames[i]+' = ? ';
               placeHolder += '? ';
            }
        }
    }

    var updateInsertData = function( data, mode){
        // console.log(data, mode, setFlds );
        // return;
        var flds  = [];
        db = new dbSqlite3.Database(sqlFileName);
        db.serialize(function() {
            db.run("begin transaction");
                if( mode == 'sqlInsert')
                    var stmt = db.prepare("INSERT INTO "+userTable+" VALUES (" + placeHolder + ")");
                else
                    var stmt = db.prepare("UPDATE "+userTable+setFlds+" WHERE RecNo = ?" );

                data.forEach(function( entry ) {
                    flds = entry.split("|");
                    if( mode == 'sqlInsert') flds[0] = null;
                    stmt.run( flds );
                });
            db.run("commit");
            stmt.finalize();

            db.close();

            // db.close(function() {
            //   /* Close create PDF */

            // });
        }); // end db.serialize
    } // end updateInsertData


    var selectQuery = function( qStmnt ){
        // var rowData = [];
        // return new Promise(function (resolve, reject) {
        //     db = new dbSqlite3.Database(sqlFileName);
        //     db.serialize(function() {
        //         db.all(qStmnt, function(err, row) {
        //             if(err){
        //                 console.log(err);
        //                 return err;
        //             }
        //             rowData = row;
        //         });
        //     }); // End db.serialize

        //     db.close(function() {
        //         /* Close create PDF */
        //         if ( rowData.length > 0 ) {
        //             // console.log('rowData',rowData[0].Dcode );
        //             resolve( rowData );
        //         } else {
        //             reject( 'failed' );
        //         }
        //     });
        // });// end promise

    } // end of selectQuery

    var deleteById = function( param, fldName ){
        db = new dbSqlite3.Database(sqlFileName);
        db.serialize(function() {
            db.run(`DELETE FROM ${userTable} WHERE ${fldName} = ?`, param, function(err) {
                if(err) 
                    console.log(err)
                else
                    console.log("Delete .......  Successful | ",fldName, param);
            });

            db.close();            
        })
    } // end of deleteById


    var findById = function( fldName, param ){
        let qStmnt =`SELECT * FROM ${userTable} where ${fldName} = '${param}'`;

        return new Promise(function (resolve, reject) {
            db = new dbSqlite3.Database(sqlFileName);
            db.serialize(function() {
                db.all(qStmnt, function(err, row) {
                    if(err){
                        console.log('error',err);
                        //return err;
                    }
                    rowData = row;
                });
            }); // End db.serialize

            db.close(function() {
                /* Close create PDF */
                if ( rowData.length > 0 ) {
                    // console.log('sqlModel: success!: ', rowData);
                    resolve( rowData );
                } else {
                    // console.log('sqlModel: failed: ', rowData);
                    reject( 'failed' );
                }
            });

        });// end promise

    } // end of findOne

    return {
        init    : init,
        insert  : insertData,
        update  : updateData,
        select  : selectQuery,
        findById: findById,
        delete  : deleteById
    }

}();
