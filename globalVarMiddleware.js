
module.exports =  middleware = {

    myHelpers: function(req, res, next){
        res.locals = ({
            todayIs     : new Date(),
            getDate     : function(){ return new Date().toLocaleDateString();},
            dbSqlite3   : require('./node_modules/sqlite3').verbose(),
            sqlFileName : `${__dirname}/lib/sqlite/csvImport.sqlite`,
            isObjEmpty  : function(obj){ return ( Object.keys(obj).length === 0 && obj.constructor === Object  );},
            removeSpaces: function(str){ return str.replace(/\s/g, ''); },
            escapeSpecialChars: function(str){ return str.replace(/[-~]*/g, ''); },
            joinLines   : function(str){ return str.split('-', 2).join(' ').replace(" ", "-"); },
            scrubData   : function(str){ return str.replace(/[^0-9a-zA-Z \- \,]/g, ""); }            
        });
        next();
    }
};

// app.use(middleware.globalLocals);
// app.get('/', middleware.index, middleware.render('home'));
