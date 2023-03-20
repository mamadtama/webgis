var express = require('express');
var router = express.Router();
var http = require('http');
var fs = require('fs');
var url = require('url');
const { Client } = require('pg')
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'donga2020',
  port: 5432,
})



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/test1', function(req, res, next) {
  res.render('test', { title: 'Express' });
});


router.get('/wa', function(req, res, next) {
  console.log('index');
});

router.get('/test', function(req, res, next) {
  client.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
  client.query('SELECT * FROM abby_1979', (err, result) => {
    if (err) throw err
    console.log(result)
//    res.json(result)
    client.end()
  })
});

router.get('/ty', function GrabData(bounds, res){
  pg.connect(conn, function(err, client){
  var moisql = 'SELECT ttl, (ST_AsGeoJSON(the_geom)) as locale from cpag;'
  client.query(moisql, function(err, result){
  var featureCollection = new FeatureCollection();
    for(i=0; i<result.rows.length; i++){
      featureCollection.features[i] = JSON.parse(result.rows[i].locale);
      featureCollection.properties[i] = JSON.parse(result.rows[i].ttl); //this is wrong
   }

   res.send(featureCollection);
   });

});
})

 function FeatureCollection(){
   this.type = 'FeatureCollection';
   this.features = new Array();
   this.properties = new Object;  //this is wrong
 };


function FeatureCollection2(rows){
    var obj, i;

    obj = {
      type: "FeatureCollection",
      features: []
    };

    for (i = 0; i < rows.length; i++) {
      var item, feature, geometry;
      item = rows[i];

      geometry = JSON.parse(item.geometry);
      delete item.geometry;

      feature = {
        type: "Feature",
        properties: item,
        geometry: geometry
      }

      obj.features.push(feature);
    } 
    return obj;
  }




module.exports = router;
