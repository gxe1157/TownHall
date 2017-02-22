// exports = module.exports;
// Evelio Velez Jr.  Nov 12 2016
var fs = require("fs");

module.exports = function( myPath ){
    // console.log('1- myPath ',myPath );
    var fileIsNewJersey = false;
    if( myPath.indexOf( '_NewJersey' ) != -1 ) fileIsNewJersey = true;

    var files = fs.readdirSync(myPath);
    var fileLength = files.length;
    var dealerFile = '';
    var parseLine = [];
    var chkMatch = '';
    var arrImage = [];
    var objFileNames = {};

    var fixTownName = function(checkThis){
        if( checkThis != undefined )
            return checkThis.split('.',1).toString().toUpperCase();
    }


    var buildObj = function( key, value ){
        // console.log(key, value);
        objFileNames[ key.trim() ] = value;

        /* Reset vars to */
        chkMatch = dealerFile;
        arrImage = [];
    }

    /* Build file list from directory, put into object */
    for ( var i = 0; i < fileLength; i++ ) {
        parseLine  = files[i].split( '-');
        if( parseLine[2] != undefined ){
            dealerFile = fileIsNewJersey === false ? `${parseLine[0]}-${parseLine[1]}-${parseLine[2]}` : fixTownName( parseLine[2] );

            /* Init chkMatch on first pass */
            if( i === 0 ) chkMatch = dealerFile;
            if( chkMatch !== dealerFile ) buildObj(chkMatch, arrImage );
            arrImage.push(files[i]);
        }
    }
    if( arrImage.length > 0) buildObj(chkMatch, arrImage );
    console.log(fileLength, 'dirFiles',objFileNames);
    return objFileNames;

};
