
const fs  = require('fs');
const path= require('path');
var arrObj = {}

module.exports = function (res) {
    var dirSource = '';
    basePath  = './datasource';

    var getDirList = function(file, index){
         return fs.statSync( path.join( dirSource, file )).isDirectory() ?  file : '';
    }

    var readPath = function( thisDir ){
            dirSource = basePath+'/'+thisDir;     /* path to read */
            var readFiles = fs.readdirSync( dirSource );  /* read all file names in this dir */
            results = readFiles.map( getDirList ).filter(Boolean); /*Get only dir remove emplty values */
            return results;
    }

    var readDir = function( basePath ){
        var buildObj = {};
        /* Get all directory orders */
        var baseDir  = readPath( '' );
        var qStmnt, getCount = 0;

        var jobDir    = [];
        var countDir = 0;
        for (var i=0; i<baseDir.length; i++) {
            var subDir1 = [];
            var subDir1 = readPath( baseDir[i] );
            // console.log(baseDir[i], 'subDir1',subDir1);
            buildObj = { [baseDir[i]]: {} };
            // console.log('Eve',buildObj);
            /* final level dir */
            for(var x = 0; x< subDir1.length; x++){
                countDir++;
                var thisPath ='/'+baseDir[i]+'/'+subDir1[x];
                var subDir2 = readPath( thisPath );
                // subDir2.unshift('Select');
                buildObj[baseDir[i]][subDir1[x]] = subDir2;
            }

            jobDir.push( buildObj );
            // console.log( 'Array',i,jobDir[i] );
        }
        return jobDir;
    }

    /* Get all directory orders */
    arrObj = readDir( basePath );

    var wo = [];
    var deduped_wo = [];
    allWorkOrders = JSON.stringify(arrObj);
    for( var i in arrObj){
        wo.push( Object.keys(arrObj[i]).toString() );
    }
    wo.unshift('Select');

    var deduped_wo = wo.filter(function(elem, pos) {
      return wo.indexOf(elem) == pos;
    });

    return [ allWorkOrders, deduped_wo ];
}
