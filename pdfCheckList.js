// exports = module.exports;
// Evelio Velez Jr.  Dec 13 2016

module.exports = function(req, res) {
var fs = require("fs");
	var pdf = require("pdfkit");

	/* Global functions */
	var GVM = res.locals;
	var sqlRequest = GVM.isObjEmpty( req.params ) ? req.body: req.params;

	/* Init SQLite3 */
	var sqlModel  = require('./sqlModel');
	sqlModel.init( userTable, GVM.sqlFileName);
	var userTable = sqlRequest.workOrder;

    /* PDF setup */
    var pos_x = 0, pos_y = 0, moveLine = 20;
	var myDoc = new pdf({
		// by default, all are 72 pixes/inch
	    bufferPages: true,
	    size: [ 612, 792 ],
	    margins : { top: 36, bottom:10, left: 0,  right: 0  }
	});

	/* Init var */
	var rowData = [], fld = [];
	var qStmnt, myPath, fileOutput, oData ;

  var pdfHeader = function( promoType ){
    	pos_x = 72, pos_y = 124;
			/* [box_x, box_y, boxWidth, boxheight] */
	    myDoc.rect(54, 109, 504, 27)
	         .fillColor('black', 0.1)          // This add gray scale
	         .fillAndStroke()
	         .fillColor('black', 1 )
	         .stroke();

			myDoc.font('Times-Roman')
				 .fontSize( 22 )
				 .text( `Town Hall Dealers`, 0, pos_y-100, { width: 612, align: 'center' } )
				 .fontSize( 16 )
				 .text( `${sqlRequest.output}`, 0, pos_y- 70, { width: 612, align: 'center' } )
				 .fontSize( 12 )
	 			 .text( `Work Order: ${sqlRequest.workOrder}   [ ${promoType} ]`, 0, pos_y- 40, { width: 612, align: 'center' } )
				 .fontSize(11)
				 .text( 'Dcode', pos_x, pos_y, { width: 50, align: 'left' } )
				 .text( '', pos_x+50, pos_y, { width: 150, align: 'left' } )
				 .text( 'Files', pos_x*4, pos_y, { width: 22, align: 'right' } )
				 .text( 'Count', pos_x*4.4, pos_y, { width: 27, align: 'right' } )
				 .text( '', pos_x*4.6, pos_y, { width: 54, align: 'right' } );

			myDoc.text( 'Status', pos_x*5.5, pos_y, { width: 144, align: 'left' } )
		    	 .text( '', pos_x*7, pos_y, { width: 50, align: 'right' } );

    }

    var pdfLine = function( showLine ){
    	if( oData['ModDate'] == null ) oData['ModDate'] = '';

		myDoc.font('Times-Roman')
			 .fontSize(10)
			 .text( oData['Dcode'], pos_x, pos_y, { width: 140, align: 'left' } )
			 .text( oData['NoFiles'], pos_x*4, pos_y, { width: 18, align: 'right' } )
			 .text( oData['Count'], pos_x*4.4, pos_y, { width: 18, align: 'right' } )

		if(showLine == true){	 
		    myDoc.text( oData['BatchNo'], pos_x*5.5, pos_y, { width: 144, align: 'left' } );
	 	}	 
	}


	var pdfTopAlign = function( pos_y, pos_x, widthAdj ){
		myDoc.fontSize(10)
			.text( `|`, pos_x, pos_y, { width: widthAdj, align: 'left' } )
			.text( `|`, pos_x, pos_y, { width: widthAdj, align: 'right' } )
			.text( `|`, pos_x, pos_y, { width: widthAdj, align: 'center' } );
	}

	var createPDF = function( rowData ){
		/* Size based on 72 pixes/inch  */
		myDoc.pipe(fs.createWriteStream(`${myPath}/${fileOutput}`));

		var headerTag = rowData[0].PromoType;
		pdfHeader( headerTag );
		pos_x = 72, pos_y = 144;
		var lineCount = 0, pages = 0, lineDn = 12;
        var chkMatch = '';
        var showLine = true;

		for( var line in rowData ){
			lineCount++;
			oData = rowData[line];

            // if( line == 0 ) chkMatch = oData['BatchNo'];
            if( chkMatch != oData['BatchNo'] ){
            	chkMatch = oData['BatchNo'];
				showLine = true;
				pos_y += lineDn;
            } else {
				showLine = false;			
            }

			if( lineCount > 49  || headerTag != oData['PromoType']){
				// myDoc.text( 'Continued on next page...', 0, pos_y+lineDn, { width: 612, align: 'center' } );
				lineCount = 0;
				headerTag = oData['PromoType'];
				myDoc.addPage();
				pdfHeader( headerTag );
				pos_x = 72, pos_y = 144;
				pages++;
			}
			pdfLine( showLine );
			pos_y += lineDn;
		}

		/* Go back and print on bottom of pages */
		for( var pg = 0; pg < pages+1; pg++) {
			myDoc.switchToPage( pg );

			myDoc.moveTo( 72, 748)
					.lineTo( 540, 748)
					.stroke();

			myDoc.fontSize( 16 )
				 .text( `Page ${pg+1} of ${pages+1}`, 0, 756, { width: 612, align: 'center' } );
		}

		/* Close create PDF */
		myDoc.end();
	    res.send( `${myPath}/${fileOutput}` );

	} // end createPDF


	/*  main App */
	myPath ='./lib/pdfout';
	qStmnt = `SELECT * FROM ${userTable} WHERE DealerCode = '${sqlRequest.dealerCode}' and PrintCount > 0 ORDER BY PromoType, Status`;
	fileOutput = 'dealer.pdf';

	db = new GVM.dbSqlite3.Database(GVM.sqlFileName);
	db.serialize(function() {
		db.all(qStmnt, function(err, row) {
			if(err){
			  console.log(err);
			  return err;
			}
			rowData = row;
		});
	}); // End db.serialize

	db.close(function() {
		/* Close create PDF */
		if( rowData.length > 0 )
			createPDF(rowData);
		else
			res.send( `No Data Available...... ` );

	});

}// End module.exports
