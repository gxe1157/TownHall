// exports = module.exports;
// Evelio Velez Jr.  Dec 13 2016

module.exports = function(data, myPath, idNum) {
	// console.log('data', data);
	
		var fs = require("fs");
		var pdf = require("pdfkit");

		var code 	  = data.code;
		var promoType = data.promoType;
		var town      = data.town;
		var printDate = data.printDate;
		var workOrder = data.workOrder;
		var printTotal= data.printTotal;
		var fileOutput= data.fileOutput;

		// console.log("Prg: pdfSlipsheets: 16 ...", fileOutput);
		console.log('idNum',idNum);

		var createPDF = function(){
				/* Size based on 72 pixes/inch
				*  3.75 * 72 = 270 | 10.63 * 72 = 765.4
			    */

				var myDoc = new pdf({
				    size: [ 270,765.4 ],
				    margins : { // by default, all are 72
						        top: 36,
						        bottom:10,
						        left: 10,
						        right: 10
							  }
			    });

				myDoc.pipe(fs.createWriteStream(`${myPath}/${fileOutput}`));

				myDoc.fontSize(32)
				   .text( promoType, { width: 268, align: 'center' } );

				myDoc.fontSize(22)
				   .fillColor('red')
				   .text( code, { width: 268, align: 'center' } );

				myDoc.fontSize(14)
				   .fillColor('#000')
				   .moveDown()
				   .text( 'Mail Cycle: '+workOrder, { width: 268, align: 'center' } )
				   .moveDown(5)
				   .text( town, { width: 268, align: 'center' } )
				   .moveDown()
				   .text( 'Print Date: '+printDate, { width: 268, align: 'center' } )
				   .text( printTotal, { width: 268, align: 'center' } );

				myDoc.fontSize(12)
				   .text( `[ ${ idNum.length } Files printed in this batch.  ]`, 10, 504,  { width: 268, align: 'center' } )
				   .moveDown()
  				   .text( '     '+idNum.toString(), { width: 250, align: 'left' } )

				// Close create PDF
				myDoc.end();
			}

			createPDF();

}// End module.exports
