/* sqlSetup */

module.exports = function (req, res) {
    var sqlModel  = require('../sqlModel');    	
    // /* Global functions */
    var GVM = res.locals;
    var sqlRequest = GVM.isObjEmpty( req.params ) ? req.body: req.params;
    var userTable = sqlRequest.workOrder;
    /* Init SQLite3 */
    sqlModel.init( userTable, GVM.sqlFileName);
    return [ sqlRequest, sqlModel,GVM ];
};
