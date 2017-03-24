
$(document).ready(function(){

    $( "#sendToPdf" ).click( function() {
        $( ".status" ).off( "click" );
        $( "#sendToPdf" ).off( "click" );
    });

    $('body').on('click', function() {
        $("td:contains('Completed')").click(function(event){
          event.stopPropagation();
          actionSelect( $(this).html() );
         })
        .hover( function() {
            $(this).css('background-color', '#d9d9d9')
        }, function() {
            $(this).css('background-color', '')
        });
    });

});

window.onload = function() {
  /* This click inits the jquery after ajax */
  $('#selReport').click();

  /* Object from express with select options */
  if(  _('dc') ){
    oJobDir  = JSON.parse(document.getElementById("dc").value);
  }

  if(  _('TotalCount') )  chkBoxScan( 'init', null );
  if( _('jobDirSelected') ) _('selReport').value = _( 'jobDirSelected' ).value ;
  if( _('arrlength') ) checkCountPrinted('SD1');

}


function _(el){
    return document.getElementById(el);
}

function clearMess(){
    document.getElementById( 'mess' ).style.display = 'none';
}

var addTown = function(){
    var nextTownId    = +_('arrlength').value + 1;
    var newDealerCode = ` ${ _('dealerCode').value }-${nextTownId} `;
    var myMethod = 'get';
    var myAction = `getTownData/${newDealerCode}/${_('jobDirSelected').value}/${_('dealerCode').value}/${_('allJobDir').value}/${_('workOrder').value}`;
    getPage( myMethod, myAction );
}

var editLine = function( recNo ){
    var myMethod = 'get';
    var myAction = 'editData/'+recNo+'/'+_('allJobDir').value+'/'+_('workOrder').value;
    getPage( myMethod, myAction );
}

var pagesOutput = function(lineNum){
    var x = _('printed'+lineNum).innerHTML == 0 ? +_('reprint'+lineNum).innerHTML + +_('setCnt'+lineNum ).innerHTML : +_('reprint'+lineNum).innerHTML;
    x     = (+_('fileCnt'+lineNum ).innerHTML * +x )/4;
    return Math.ceil(x);
}

var checkCountPrinted = function( actionState ) {
    var arrLen     = _('arrlength').value;
    var printCount = 0;
    arrLen++;

    for( var i = 1; i<arrLen; i++){
         printed  = +_('printed'+i).innerHTML;
         printCount += printed;
    }

    if( printCount == 0 && actionState == 'SD1'){
        _('dropTable').innerHTML = `&nbsp;&nbsp;&nbsp;<button class="btn btn-xsm btn-danger btn-inline-block "
         type="button" onclick= " validate_delete('post', 'dropTable')">Delete File </button>`;
    } else {
        _('dropTable').innerHTML = '';
    }

}

var prepareData = function (query){
    var arrLen    = _('arrlength').value;
    var printData = [];
    var townCode  = [];
    var setCount, count, printed, reprint, expireMess;
    arrLen++;

    for( var i = 1; i<arrLen; i++){
         count    = +_('setCnt'+i).innerHTML;
         printed  = +_('printed'+i).innerHTML;
         reprint  = +_('reprint'+i).innerHTML;
         townCode = _('twn'+i).innerHTML.split("|");
         expireMess = _('respLine'+i).innerHTML;
         expireMess = ( expireMess.substr(0, 4) == '....' ) ? expireMess.substr(5, 40) : expireMess;
         setCount = printed < count ? +count + +reprint : +reprint;

         if(  ( _('chkBx'+i).checked == true && setCount > 0 ) || ( query == 'doReverse' && _('chkBx'+i).checked == true ) )
            printData.push( `${townCode[0]}|${setCount}|${printed}|${_('fileCnt'+i).innerHTML}|${i}|${ _('RecNo'+i).value }|${expireMess}` );
    }

    return printData;
}

var process = function( routeOpt ){
    var query = routeOpt || null;

    var printData = prepareData(query);

    if( printData.length > 0){
        var data = '/'+routeOpt+'/'+_('workOrder').value+'/'+_('dealerCode').value+'/'+_('selReport').value+'/'+printData.toString();
        ajaxFusionPro(data);
    }else{
        alert( 'No files were selected for processing.\nClick the checkbox next the file you wish to print.' );
        return false;
    }
}

var actionSelect = function( routeOpt ){
    var query = routeOpt || null;
    var recNo, outPut = "upDateScreen";
    var updateSqlFile = [];

    if( query.substr(0,2) == 'CM' ) {
        _('expireMess').value = null;
        var updateData = prepareData( query.substr(0,2) );

        if( updateData.length > 0){
            if( query == 'CM1' )
              _('expireMess').value = prompt("Please enter expiration message: ", '' );

            /* Prepare as expireMess+'|'+recno */
            updateData.forEach(function(entry) {
                var [ dealerId, setCount,printed,nofiles, respIndex, recNo, expireMess ] = entry.split('|');
                updateSqlFile.push(`${_('expireMess').value}|${recNo}`);
            });

            var data = '/expireMessage/'+_('workOrder').value+'/'+updateSqlFile.toString();

            ajaxExpireMess(data, updateData, _('expireMess').value );
            return;
        }else{
            alert( 'No files were selected for processing.\nClick the checkbox next the file you wish to print.' );
            return;
        }

    } else {
        var data = '/townHall/'+query+'/'+outPut+'/'+_('workOrder').value+'/'+_('dealerCode').value+'/'+_('selReport').value+'/'+_('allJobDir').value;
        ajaxReq(data, query);
    }
}

var messDisplay = function(message){
        _( 'mess' ).style.display = 'block';
        _( 'mess').innerHTML = message;
}

var updateSelect = function (obj, addSelectValue ){
    var workOrderDir = obj.value;

    _('dealerCode').options.length = 0;
    if( obj.selectedIndex == 0 ){
        if( document.getElementById("jobDir") ){
          _('jobDir').options.length = 0;
        }
    }
    getDealerCodes( addSelectValue, workOrderDir );
}

var getDealerCodes = function( addSelectValue, workOrderDir ){
    clearMess();
    var [sel, selwo ] =  getKeyData();
    if( selwo == 'Select') return;
    if( _("accept") ) _("accept").disabled = false;

    var key2 = Object.keys(oJobDir[sel][selwo]);
    if( addSelectValue == 'reportGenerator' ) key2.unshift( 'All Dealers' );
    key2.unshift( 'Select' );

    ajaxStatus( workOrderDir )
      .then(function( results ) {
          buildSelOpt('dealerCode',key2, results);
      });

}

var getJobFolders = function(){
    clearMess();
    if( document.getElementById( 'csvFile' ) ) _("csvFile").value ='';

    var [sel, selwo, dealerc ] =  getKeyData();
    var key3    = oJobDir[sel][selwo][ dealerc ];
    buildSelOpt('jobDir',key3, null);
}

var getKeyData = function(){
    /* deconstruct array */
    return [ _('workOrder').selectedIndex -1, _('workOrder').value, _('dealerCode').value ];
}

var buildSelOpt = function( selName, arrSel, results ){
    if( document.getElementById(selName) ){
        _(selName).options.length = 0;
        for( var i in arrSel){
            _(selName).options[i] = new Option( arrSel[i] );

            if( results != null && results[ arrSel[i] ] != undefined ){
                _(selName).options[i].style.color = results[ arrSel[i] ] == 0 ? '#000' : 'red';
                _(selName).options[0].style.color = '#000';
            }
        }
    }
}

var homePageButton = function( obj ){
   if( _('user_name').value == '' ){
       alert('User Name is Required ') ;
       return false;
   }

   _('URL').value = obj.id;
   _('mode').value = _(obj.id).innerHTML;
   document.myForm.action= '/pageProcess';
   document.myForm.submit();
}

var getPage = function( myMethod, myAction ){
    // console.log(myMethod, myAction);
    document.myForm.method= myMethod;
    document.myForm.action= '/'+myAction;
    document.myForm.submit();
}

var find_radio_opt =  function( radio_name ){
    var r = document.getElementsByName(radio_name);
    for(var i = 0; i < r.length; i++)
        if( r[i].checked ==true ) break;

    return  r[i] ? r[i].value : 'None';
}

var chkBox = function ( lineNum ){
    var noPages = 0;
    var addPages = 0;

    if( _('respLine'+lineNum).innerHTML == null ) _('respLine'+lineNum).innerHTML = '';
    _( 'pages'+lineNum).innerHTML = '';

    /*  setCnt${lineNum} > 0 ? 'NoFiles' > 0 ? '....' : 'File not found' : 'No mailing'; */
    var myColor = _(`setCnt${lineNum}`).innerHTML > 0 ? _(`fileCnt${lineNum}`).innerHTML > 0 ? '#000' : 'red' : 'blue';
    _(`respLine${lineNum}`).style.color = myColor;

    if( _( 'chkBx'+lineNum ).checked ){
        noPages  = pagesOutput(lineNum);
        _( 'pages'+lineNum).innerHTML = noPages;
    }

    return  noPages;
}

var chkBoxByGroup = function( groupBy, lineNum ) {
    /* This will toggle check box by group */
    groupBy = 'Completed';
    var toggleState = _( 'chkBx'+lineNum ).checked === true ? true : false;
    var str = _('respLine'+lineNum).innerHTML;

    var length = _('arrlength').value;
    length++;

    for(var i = 1; i < length; i++){
        if( str.indexOf( groupBy ) > 0 ){
            _('chkBx'+i ).checked = toggleState;
        }
    }
}

var chkBoxToggle = function(){
    var toggleState = _('chkBx0').checked === true ? true : false;
    chkBoxScan( 'toggle', toggleState);
}

var chkBoxScan = function( mode, toggleState ){
    /* mode -> init, toggle, sumChkBxs */

    if( mode == 'init')  _('chkBx0').checked = false;

    var totalPages = 0;
    _('TotalCount').innerHTML = '';

    var length = _('arrlength').value;
    // console.log('length',length)
    length++;


    for(var i = 1; i < length; i++){
        if( mode == 'toggle' ){
          _('chkBx'+i ).checked = toggleState;
        }
        totalPages += chkBox(i);
        _('TotalCount').innerHTML = totalPages > 0 ? totalPages : null;
    }
}

var updateJobDir = function(){
    var [sel, selwo, dealerc ] =  getKeyData();
    _('allJobDir').value =  oJobDir[sel][selwo][ dealerc ].toString();
}


var reportSelect = function(){
    var query  = 'SD1';

    var outPut = "upDateScreen";
    var data = '/townHall/'+query+'/'+outPut+'/'+_('workOrder').value+'/'+_('dealerCode').value+'/'+_('selReport').value+'/'+_('allJobDir').value;
    ajaxReq(data, query);
}

var validate_addTown = function( myMethod, myAction ) {
    var errors = ['The following error(s) were found...\n'];

    if( _('city').value.length == 0 ) errors.push('City is required');
    if( _('zip').value.length  == 0 ) errors.push('Zip is required');
    if( _('count').value == 0 ) errors.push('Count must greater than 0');

    if( errors.length > 1  ){
      var errorMess = '';
      for( var i = 0; i < errors.length; i++) errorMess += errors[i]+'\n';
      alert( errorMess );
      return false;
    }

    _('query').value = 'AT1';
    _('dcode').disabled = false;
    getPage( myMethod, myAction );
}

var validate_delete = function( myMethod, myAction ) {

    if( _('sqlDcode') && _('sqlDcode').length > 0 ){
      var confirmMess = `You are about to delete ${ _('sqlDcode').value }.`;
    } else {
      var confirmMess = `You are about to drop the databse.`;
    }

    var r = confirm( confirmMess );
    if (r == false) {
        _('count').value = _('sqlCount').value;
        return false;
    }else{
        r = confirm(`Are you sure?.........`);
        if (r == false){
            _('count').value = _('sqlCount').value;
            return false;
        }
    }
    getPage( myMethod, myAction );
}

var validate_edit = function( myMethod, myAction ) {
    if( _('sqlCount').value != _('count').value ) {
      var r = confirm(`You are about to change the Print Count from ${_('sqlCount').value} to ${_('count').value}.`);
      if (r == false) {
          _('count').value = _('sqlCount').value;
          return false;
      }
    }
    _('count').disabled = false;
    _('reprint').disabled = false;
    _('Dcode').disabled = false;
    _('mode').value  = 'sqlUpdate';

    getPage( myMethod, myAction );
}

var validate_newOrder = function( myMethod, myAction ){
    if( _('workOrder').value == 'Select' || _('dealerCode').value == 'Select'){
        alert('Please select an item in the list the list. Check all select menus... ');
        return false;
    }

    var isFileName = (_("dealerCode").value).toUpperCase();
    var uploadName = _("csvFile").value;
    var upload = uploadName.split('\\');

    uploadName  = upload[2] == undefined ? uploadName.toUpperCase() :  upload[2].toUpperCase();
    var isMatch = uploadName.indexOf(isFileName);

    if(isMatch == -1){
        var message ='<strong> Error! </strong> The file you selected, <span class="highlite">'+ uploadName  +'</span>,  does not belong to dealer <span class="highlite"> '+isFileName+' </span>';
        messDisplay( message );
        _( 'csvFile' ).value = '';
        return false;
    }

    updateJobDir();

    var data = '/queryData/'+_('mode').value+'/'+uploadName+'/'+_('workOrder').value;
    ajaxIsFileImported(data, myMethod, myAction, _('mode').value, uploadName);
}

var validate_update = function(){
    if( _('workOrder').value == 'Select' || _('dealerCode').value == 'Select' || _('jobDir').value == 'Select'){
        alert('Please select an item in the list the list. Check all select menus... ');
        return false;
    }
    updateJobDir();

    var uploadName = null;
    var data = '/queryData/'+_('mode').value+'/'+uploadName+'/'+_('workOrder').value+'/'+_('dealerCode').value+'/'+_('jobDir').value;
    ajaxIsFileImported(data, 'post', 'getOrder', _('mode').value);

}

var validate_report = function( myMethod, myAction ){
    if( _('workOrder').value == 'Select' || _('dealerCode').value == 'Select' || _('selReport').value == 'Select'){
        alert('Please select an item in the list the list. Check all select menus... ');
        return false;
    }

    var outPut = _('selReport').options[_('selReport').selectedIndex].text;
    var query  = _('selReport').value;

    var data   = '/report/'+query+'/'+outPut+'/'+_('workOrder').value+'/'+_('dealerCode').value+'/runReports';
    ajaxPDF( data );
}

var ajaxStatus = function( data ) {
    var oDC = {};

    return new Promise(function (resolve, reject) {
      var xhttp_status = new XMLHttpRequest();
      xhttp_status.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            var resp = this.responseText;

            if ( resp !== 'SQL not FOUND' ) {
                var arr_from_json = JSON.parse( resp );
                var name = '';
                for( var line in arr_from_json){
                    Dname = arr_from_json[line].DealerCode;
                    oDC[ Dname ] = arr_from_json[line].val >= 0 ? 1: 0;
                }
                console.log( 'oDC', oDC );
                resolve( oDC );
            } else{
                resolve( null );
            }

          }
      };

      xhttp_status.open( "GET", "/lib/"+data, true );
      xhttp_status.send();
    })// end promise
}


var ajaxPDF = function( data ) {
    var xhttp_rpt = new XMLHttpRequest();

    xhttp_rpt.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var resp = this.responseText;

          if( resp == 'File not found' )
              messDisplay('<strong> Alert! </strong> Records not found...., <span class="highlite"> Import Work Order Data. </span>');
          else
             _('pdfWindow').innerHTML = `<a href="${resp}" class="btn btn-danger" target="_blank" onClick="Javascript: _('pdfWindow').innerHTML =''" >Open Pdf</a>`;

        }
    };

    xhttp_rpt.open( "GET", data, true );
    xhttp_rpt.send( );
}

var ajaxIsFileImported = function(data, myMethod, myAction, mode, uploadName){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          var resp = this.responseText;
          if( resp == 'true' ){ // 100 records found
              if( mode == 'updateOrder'){
                  getPage( myMethod, myAction ); //return true;
              } else {
                messDisplay('<strong> Alert! </strong> You have already imported , <span class="highlite">'+uploadName+'</span>');
                _("accept").disabled = true;
                document.myForm.reset();
                return false;
              }
          }else{
              if( mode == 'updateOrder' ){
                  messDisplay('<strong> Alert! </strong> Records not found...., <span class="highlite"> Import Work Order Data. </span>');
                  return false;
              }
              /* getPage to import new WorkOrder */
              getPage( myMethod, myAction );
          }
      }
    };

    xhttp.open( "GET", data, true);
    xhttp.send();
}

var ajaxExpireMess = function(data, updateData, newExpireMess ){
    var xhttp_updt = new XMLHttpRequest();
    // alert( "readyState: "+this.readyState+" | status: "+this.status );
    xhttp_updt.onreadystatechange = function() {

      if (this.readyState == 4 && this.status == 200) {
          var resp = this.responseText;
          updateData.forEach(function(entry) {
              var [ dealerId, setCount,printed,nofiles, respIndex, recNo, expireMess ] = entry.split('|');
               _( 'respLine'+respIndex ).innerHTML = `.... ${ newExpireMess.trim() }`;
               _(`chkBx${respIndex}`).checked = false;
               _(`pages${respIndex}`).innerHTML = null;
               _('TotalCount').innerHTML = null;
          });
          $('#selReport').click();
      }

    };

    xhttp_updt.open( "GET", data, true);
    xhttp_updt.send();
}

var ajaxFusionPro = function(data){
    var xhttp_updt = new XMLHttpRequest();
    // alert( "readyState: "+this.readyState+" | status: "+this.status );
    xhttp_updt.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          var resp = this.responseText;
          var reply = resp.split(",");
          var lineNumber = 0;
          _(`chkBx0`).checked = false;

          for( var line in reply ){
               var [ response, modDate, reprint, printed, lineNum, recNo, dCode ] = reply[line].split("|");
               lineNumber = lineNum.replace(/\s+/g, '');
               _( 'respLine'+lineNumber ).innerHTML = response;
               _(`reprint${lineNumber}`).innerHTML = reprint;
               _(`printed${lineNumber}`).innerHTML = printed;
               _(`chkBx${lineNumber}`).checked = false;
               _(`pages${lineNumber}`).innerHTML = null;
               _('TotalCount').innerHTML = null;
          }
          $('#selReport').click();
          checkCountPrinted('SD1');
      }
    };

    xhttp_updt.open( "GET", data, true);
    xhttp_updt.send();
}

var ajaxReq =  function(data, query){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          var resp = this.responseText;
          // console.log('rest', resp);
          var arrResponse = JSON.parse(resp);
          _('bodyResponse').innerHTML = ' ';

          var newTable     = '';
          var responseData = '';
          var lineNumber   = 0;

          for ( var line in arrResponse ) {
              // console.log(arrResponse[line]);
              responseData = arrResponse[line];
              lineNumber   = parseInt(line) + 1;
              newTable += `<tr>
                           <td>${lineNumber}<input type ="hidden" id = "RecNo${lineNumber}" name = "RecNo${lineNumber}" value = '${responseData['RecNo']}' /> </td>
                           <td id="twn${lineNumber}">${responseData['Dcode']} | ${responseData['City']}</td>
                           <td id="fileCnt${lineNumber}" class="tdNumeric">${responseData['NoFiles']}</td>
                           <td id="setCnt${lineNumber}" class="tdNumeric">${responseData['Count']}</td>
                           <td class="tdNumeric">${responseData['ModDate']}</td>
                           <td class="status" id="respLine${lineNumber}">${responseData['Status']}</td>
                           <td id="editOpt${lineNumber}"><a href="javascript: editLine( '${responseData['RecNo']}' );">Edit</a></td>
                           <td>
                                <input name="chkBx${lineNumber}" id="chkBx${lineNumber}" value="${responseData['Dcode']}" type="checkbox" onClick="Javascript: chkBox( ${lineNumber} );  chkBoxScan( 'sumChkBxs', null);">
                           </td>
                           <td  id="reprint${lineNumber}" class="tdNumeric">${responseData['Reprint']}</td>
                           <td  id="printed${lineNumber}" class="tdNumeric">${responseData['PrintCount']} </td>
                           <td class="tdNumeric" id="pages${lineNumber}">&nbsp;</td>
                           </tr>`;
          }

          _('bodyResponse').innerHTML = newTable;
          _('arrlength').value = lineNumber;

          /* Update showSel if SD option is present */
          if( query.indexOf( 'SD' ) != -1 ) _('showSel').innerHTML = `${_(query).innerHTML} [${lineNumber}]`;;

          chkBoxScan( 'init', null);
          $('#selReport').click();
          checkCountPrinted(query);
        }

    };

    xhttp.open( "GET", data, true);
    xhttp.send();
}
