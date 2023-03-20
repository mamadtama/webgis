var express = require('express');
var router = express.Router();
var http = require('http');
var fs = require('fs');
var url = require('url');
var GeoJSON = require('geojson');
const { getClient } = require('../config/get-client');
var sql = require('yesql').pg



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/isosurface', function(req, res, next) {
  res.render('isosurface', { title: 'Express' });
});

router.get('/vector', function(req, res, next) {
  res.render('vector', { title: 'Express' });
});

router.get('/vector2', function(req, res, next) {
  res.render('vector2', { title: 'Express' });
});

router.get('/toogle', function(req, res, next) {
  res.render('toogle', { title: 'Express' });
});

router.get('/test1', function(req, res, next) {
  res.render('test', { title: 'Express' });
});
router.get('/test2', function(req, res, next) {
  res.render('test2', { title: 'Express' });
});
router.get('/wind', function(req, res, next) {
  res.render('wind', { title: 'Express' });
});
router.get('/weather', function(req, res, next) {
  res.render('weather', { title: 'Express' });
});
router.get('/typhoon3d', function(req, res, next) {
  res.render('typhoon3d', { title: 'Express' });
});

router.get('/typhoon_line', function(req, res) {  
  (async () => {
    query = "SELECT id, time, ST_AsText(geom) from typ_lines.aaline_abby_1983;"
    name_typ = "abby_1983";
    var client = await getClient();
    var result = await client.query(query);
      res.statusCode = 200;
      var trackdatac="";
      var dataGeoJSONd=[];
      trackdatac = result.rows;
      tmpc=FeatureCollectionLine(trackdatac,name_typ);
      dataGeoJSONd = GeoJSON.parse(tmpc,{'MultiLineString': 'line'});
      //console.log(dataGeoJSONd);
      res.send(dataGeoJSONd);
      await client.end();
  })();
});

router.get('/typhoon_point', function(req, res) {  
  (async () => {
    name_typ = "abby_1983";
    query1 = "SELECT id, time, ST_AsText(geom) from abby_1983;"
    query2 = "SELECT * FROM typ_sum.typhoon_sum WHERE name = 'ABBY' AND year = '1983';"
    var client = await getClient();
    var result1 = await client.query(query1);
    var result2 = await client.query(query2);
    res.statusCode = 200;
    var trackdatac="";
    var dataGeoJSONd=[];
    trackdatac = result1.rows;
    typhoonsumd = result2.rows;
    console.log(typhoonsumd['birthdate']);
    tmp=FeatureCollectionPoint(name_typ,trackdatac);
    dataGeoJSONd = GeoJSON.parse(tmp, { Point: ["lat", "lng"] });
    console.log(dataGeoJSONd);
    res.send(dataGeoJSONd); 
    await client.end();
  })();
});

function FeatureCollectionLine(trackdata,name_typ){
    const data = []
    trackdata.forEach(function(el){
      koord=el.st_astext.split('MULTILINESTRING((')[1].split('))')[0];
      x1=koord.split(',')[0].split(' ')[0];
      y1=koord.split(',')[0].split(' ')[1];
      x2=koord.split(',')[1].split(' ')[0];;
      y2=koord.split(',')[1].split(' ')[1];;
      //console.log(x1,y1,x2,y2);
      data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]], name: name_typ})
    });
    return data;
}

function FeatureCollectionPoint(name,trackdata,bd,lf,mipr,mawnd,lardi,avspeed){
    const data = []
    //st_astext: 'POINT(144 9)'
    console.log(trackdata[1].st_astext);
    trackdata.forEach(function(el){
        koord=el.st_astext.split('POINT(')[1].split(')')[0];
        x=koord.split(' ')[0];
        y=koord.split(' ')[1]; 
        data.push({lat:y,lng:x,name:name,birthdate: bd, lifetime_hours: lf, minimumpressure_hpa: mipr, 
          maximumwind_knot: mawnd, largestdiameter_km: lardi, avespeed_km_h: avspeed})
        //data.push({lat:y,lng:x,name:name})
    });
    return data;
}

router.get('/typhoontrack/:shape/:type/:name', function(req, res, next) {
  const data = []
    var shape=req.params.shape;
    var type=req.params.type;
    var name_ty = req.params.name;
    if (shape=='point'){
        if (type=="current"){
              (async () => {
                const query1 = {
                      text: 'SELECT * FROM typ_sum.typ_p2 ORDER BY id DESC'
                  }
                var client = await getClient();
                var result1 = await client.query(query1);
                name=result1.rows[0].name
                var nameTy=name.split('_')[0].toUpperCase();
                var yearTy=name.split('_')[1];
                //query2 = "SELECT id, time, ST_AsText(geom) from abby_1983;"
                
                const query2 = {
                  text: 'SELECT id, time, ST_AsText(geom) FROM ' +name,
                } 
                var result2 = await client.query(query2);
                const query3 = {
                  text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                  values: [nameTy,yearTy],
                } 
                var result3 = await client.query(query3);
                res.statusCode = 200;
                var trackdatac="";
                var dataGeoJSONd=[];
                trackdatac = result2.rows;
                typhoonsumd = result3.rows[0];
                bd = typhoonsumd['birthdate'];
                lf = typhoonsumd['lifetime_hours'];
                mipr = typhoonsumd['minimumpressure_hpa'];
                mawnd = typhoonsumd['maximumwind_knot'];
                lardi = typhoonsumd['largestdiameter_km'];
                avspeed = typhoonsumd['avespeed_km_h'];
                tmp=FeatureCollectionPoint(name,trackdatac,bd,lf,mipr,mawnd,lardi,avspeed);
                dataGeoJSONd = GeoJSON.parse(tmp, { Point: ["lat", "lng"] });
                res.send(dataGeoJSONd); 
                await client.end();
              })();
        } else if (type=="direct"){
            (async () => {
                const data = []
                const query1 = {
                  text: 'SELECT * FROM typ_sum.typ_p1'
                  }
                var client = await getClient();
                var result1 = await client.query(query1);
                res.statusCode = 200;
                namedatad=result1.rows;
                var namelistd=[];           
                namedatad.forEach(function(item,index){
                  namelistd.push(namedatad[index].name)          
                }) 
                n=0;
                for (i=0; i<namelistd.length;i++){
                      var name = namelistd[i];
                      var nameTy=namelistd[i].split('_')[0].toUpperCase();
                      var yearTy=namelistd[i].split('_')[1];
                      console.log(name,nameTy,yearTy);
                      const query2 = {
                        text: 'SELECT id, time, ST_AsText(geom) FROM ' +name,
                      }
                      const query3 = {
                        text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                        values: [nameTy,yearTy],
                      }
                      var result2 = await client.query(query2);
                      var result3 = await client.query(query3);
                      var trackdatac="";
                      var dataGeoJSONd=[];
                      trackdatac = result2.rows;
                      typhoonsumd = result3.rows[0];
                      bd = typhoonsumd['birthdate'];
                      lf = typhoonsumd['lifetime_hours'];
                      mipr = typhoonsumd['minimumpressure_hpa'];
                      mawnd = typhoonsumd['maximumwind_knot'];
                      lardi = typhoonsumd['largestdiameter_km'];
                      avspeed = typhoonsumd['avespeed_km_h'];
                      trackdatac.forEach(function(el){
                          koord=el.st_astext.split('POINT(')[1].split(')')[0];
                          x=koord.split(' ')[0];
                          y=koord.split(' ')[1]; 
                          data.push({lat:y,lng:x,name:name,birthdate: bd, lifetime_hours: lf, minimumpressure_hpa: mipr, 
                            maximumwind_knot: mawnd, largestdiameter_km: lardi, avespeed_km_h: avspeed})
                      });
                      n=n+1;
                      if (n == (namelistd.length)) {
                          console.log(data);
                          const dataGeoJSONd = GeoJSON.parse(data, { Point: ["lat", "lng"] });
                          res.send(dataGeoJSONd);     
                      }                
                  }
                await client.end();
            })();
        } else if (type=="indirect"){
            (async () => {
                const data = []
                const query1 = {
                  text: 'SELECT * FROM typ_sum.typ_p2'
                  }
                var client = await getClient();
                var result1 = await client.query(query1);
                res.statusCode = 200;
                namedatad=result1.rows;
                var namelistd=[];           
                namedatad.forEach(function(item,index){
                  namelistd.push(namedatad[index].name)          
                }) 
                console.log(namelistd);
                n=0;
                for (i=0; i<namelistd.length;i++){
                      var name = namelistd[i];
                      var nameTy=namelistd[i].split('_')[0].toUpperCase();
                      var yearTy=namelistd[i].split('_')[1];
                      console.log(name,nameTy,yearTy);
                      const query2 = {
                        text: 'SELECT id, time, ST_AsText(geom) FROM ' +name,
                      }
                      const query3 = {
                        text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                        values: [nameTy,yearTy],
                      }
                      var result2 = await client.query(query2);
                      var result3 = await client.query(query3);
                      var trackdatac="";
                      var dataGeoJSONd=[];
                      trackdatac = result2.rows;
                      //console.log(trackdatac);
                      typhoonsumd = result3.rows[0];
                      bd = typhoonsumd['birthdate'];
                      lf = typhoonsumd['lifetime_hours'];
                      mipr = typhoonsumd['minimumpressure_hpa'];
                      mawnd = typhoonsumd['maximumwind_knot'];
                      lardi = typhoonsumd['largestdiameter_km'];
                      avspeed = typhoonsumd['avespeed_km_h'];
                      //console.log(bd);
                      trackdatac.forEach(function(el){
                          koord=el.st_astext.split('POINT(')[1].split(')')[0];
                          x=koord.split(' ')[0];
                          y=koord.split(' ')[1]; 
                          data.push({lat:y,lng:x,name:name,birthdate: bd, lifetime_hours: lf, minimumpressure_hpa: mipr, 
                            maximumwind_knot: mawnd, largestdiameter_km: lardi, avespeed_km_h: avspeed})
                      });
                      n=n+1;
                      console.log(n,namelistd.length);
                      if (n == (namelistd.length)) {
                          console.log(data);
                          dataGeoJSONd = GeoJSON.parse(data, { Point: ["lat", "lng"] });
                          res.send(dataGeoJSONd);     
                      }                
                  }
                await client.end();
            })();
        } 
    } 
    else if (shape=='line'){
        if (type=="current"){
            (async () => {
              const query1 = {
                    text: 'SELECT * FROM typ_sum.typ_p2 ORDER BY id DESC'
                }
              var client = await getClient();
              var result1 = await client.query(query1);
              name=result1.rows[0].name
              var nameTy=name.split('_')[0].toUpperCase();
              var yearTy=name.split('_')[1];
              const query2 = {
                  text: 'SELECT ST_AsText(geom) as geometry FROM typ_lines.aaline_'+name+' ORDER BY id ASC'
                } 
              var result2 = await client.query(query2);
              const query3 = {
                text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                values: [nameTy,yearTy],
              } 
              var result3 = await client.query(query3);
              res.statusCode = 200;  
              var trackdatac="";
              var dataGeoJSONd=[];
              trackdatac = result2.rows;
              typhoonsumd = result3.rows[0];
              bd = typhoonsumd['birthdate'];
              lf = typhoonsumd['lifetime_hours'];
              mipr = typhoonsumd['minimumpressure_hpa'];
              mawnd = typhoonsumd['maximumwind_knot'];
              lardi = typhoonsumd['largestdiameter_km'];
              avspeed = typhoonsumd['avespeed_km_h'];
              const data = [];
              trackdatac.forEach(function(el){
                console.log(el);
                koord=el.geometry.split('MULTILINESTRING((')[1].split('))')[0];
                x1=koord.split(',')[0].split(' ')[0];
                y1=koord.split(',')[0].split(' ')[1];
                x2=koord.split(',')[1].split(' ')[0];;
                y2=koord.split(',')[1].split(' ')[1];;
                data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:name,birthdate: bd, lifetime_hours: lf, minimumpressure_hpa: mipr, 
                    maximumwind_knot: mawnd, largestdiameter_km: lardi, avespeed_km_h: avspeed})
              });  
              dataGeoJSONd = GeoJSON.parse(data,{'MultiLineString': 'line'});
              res.send(dataGeoJSONd);
              await client.end();
          })(); 
        } else if (type=="direct"){
            (async () => {
                const data = []
                const query1 = {
                  text: 'SELECT * FROM typ_sum.typ_p1'
                  }
                var client = await getClient();
                var result1 = await client.query(query1);
                res.statusCode = 200;
                namedatad=result1.rows;
                var namelistd=[];           
                namedatad.forEach(function(item,index){
                  namelistd.push(namedatad[index].name)          
                }) 
                n=0;
                for (i=0; i<namelistd.length;i++){
                      var name = namelistd[i];
                      var nameTy=namelistd[i].split('_')[0].toUpperCase();
                      var yearTy=namelistd[i].split('_')[1];
                      console.log(name,nameTy,yearTy);
                      const query2 = {
                        text: 'SELECT ST_AsText(geom) as geometry FROM typ_lines.aaline_'+name+' ORDER BY id ASC'
                      }
                      const query3 = {
                        text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                        values: [nameTy,yearTy],
                      }
                      var result2 = await client.query(query2);
                      var result3 = await client.query(query3);
                      var trackdatac="";
                      var dataGeoJSONd=[];
                      trackdatac = result2.rows;
                      typhoonsumd = result3.rows[0];
                      bd = typhoonsumd['birthdate'];
                      lf = typhoonsumd['lifetime_hours'];
                      mipr = typhoonsumd['minimumpressure_hpa'];
                      mawnd = typhoonsumd['maximumwind_knot'];
                      lardi = typhoonsumd['largestdiameter_km'];
                      avspeed = typhoonsumd['avespeed_km_h'];
                      trackdatac.forEach(function(el){
                        console.log(el);
                        koord=el.geometry.split('MULTILINESTRING((')[1].split('))')[0];
                        x1=koord.split(',')[0].split(' ')[0];
                        y1=koord.split(',')[0].split(' ')[1];
                        x2=koord.split(',')[1].split(' ')[0];;
                        y2=koord.split(',')[1].split(' ')[1];;
                        data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:name,birthdate: bd, lifetime_hours: lf, minimumpressure_hpa: mipr, 
                            maximumwind_knot: mawnd, largestdiameter_km: lardi, avespeed_km_h: avspeed})
                      });  
                      n=n+1;
                      if (n == (namelistd.length)) {
                          console.log(data);
                          //const dataGeoJSONd = GeoJSON.parse(data, { Point: ["lat", "lng"] });
                          dataGeoJSONd = GeoJSON.parse(data,{'MultiLineString': 'line'});
                          res.send(dataGeoJSONd);     
                      }                
                  }
                await client.end();
            })();
        } else if (type=="indirect"){
            (async () => {
                const data = []
                const query1 = {
                  text: 'SELECT * FROM typ_sum.typ_p2'
                  }
                var client = await getClient();
                var result1 = await client.query(query1);
                res.statusCode = 200;
                namedatad=result1.rows;
                var namelistd=[];           
                namedatad.forEach(function(item,index){
                  namelistd.push(namedatad[index].name)          
                }) 
                n=0;
                for (i=0; i<namelistd.length;i++){
                      var name = namelistd[i];
                      var nameTy=namelistd[i].split('_')[0].toUpperCase();
                      var yearTy=namelistd[i].split('_')[1];
                      console.log(name,nameTy,yearTy);
                      const query2 = {
                        text: 'SELECT ST_AsText(geom) as geometry FROM typ_lines.aaline_'+name+' ORDER BY id ASC'
                      }
                      const query3 = {
                        text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                        values: [nameTy,yearTy],
                      }
                      var result2 = await client.query(query2);
                      var result3 = await client.query(query3);
                      var trackdatac="";
                      var dataGeoJSONd=[];
                      trackdatac = result2.rows;
                      typhoonsumd = result3.rows[0];
                      bd = typhoonsumd['birthdate'];
                      lf = typhoonsumd['lifetime_hours'];
                      mipr = typhoonsumd['minimumpressure_hpa'];
                      mawnd = typhoonsumd['maximumwind_knot'];
                      lardi = typhoonsumd['largestdiameter_km'];
                      avspeed = typhoonsumd['avespeed_km_h'];
                      trackdatac.forEach(function(el){
                        console.log(el);
                        koord=el.geometry.split('MULTILINESTRING((')[1].split('))')[0];
                        x1=koord.split(',')[0].split(' ')[0];
                        y1=koord.split(',')[0].split(' ')[1];
                        x2=koord.split(',')[1].split(' ')[0];;
                        y2=koord.split(',')[1].split(' ')[1];;
                        data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:name,birthdate: bd, lifetime_hours: lf, minimumpressure_hpa: mipr, 
                            maximumwind_knot: mawnd, largestdiameter_km: lardi, avespeed_km_h: avspeed})
                      });  
                      n=n+1;
                      if (n == (namelistd.length)) {
                          console.log(data);
                          //const dataGeoJSONd = GeoJSON.parse(data, { Point: ["lat", "lng"] });
                          dataGeoJSONd = GeoJSON.parse(data,{'MultiLineString': 'line'});
                          res.send(dataGeoJSONd);     
                      }                
                  }
                await client.end();
            })();
        }
    }
});

router.get('/simulation/:charttyp/:coortyp/:typname', function(req, res, next) {
  var charttyp=req.params.charttyp;
  var coortyp=req.params.coortyp;
  var typname=req.params.typname;
  console.log(typname); 
  var selection;
  if (charttyp=='radar'){
      if (coortyp=='xcoord'){
          query = {
          text: 'SELECT * FROM simulation.tb_ens_xclass WHERE name = $1',
          values: [typname],
        }
      } else if (coortyp=='ycoord'){
          query = {
          text: 'SELECT * FROM simulation.tb_ens_yclass WHERE name = $1',
          values: [typname],
        }
      }
      (async () => {
        var client = await getClient();
        var result = await client.query(query);
        res.statusCode = 200;
        //namedatad=result.rows;
        res.send(result.rows);
        await client.end(); 
      })();
    }
  else if(charttyp=='track'){
      if (coortyp=='xcoord'){
          query = {
          text: 'SELECT * FROM simulation.tb_ens_zonal WHERE name = $1',
          values: [typname],
        }
      } else if (coortyp=='ycoord'){
          query = {
          text: 'SELECT * FROM simulation.tb_ens_meridional WHERE name = $1',
          values: [typname],
        }
      }
      (async () => {
        var client = await getClient();
        var result = await client.query(query);
        res.statusCode = 200;
        res.send(result.rows);
        await client.end(); 
      })();
  }
  else if (charttyp=='error'){
      (async () => {
          var queryA = {
            text: 'SELECT * FROM simulation.tb_ens_error WHERE name = $1 AND type = $2 ORDER BY ts ASC LIMIT 30',
            values: [typname,'xcoord'],
          }
          var queryB = {
              text: 'SELECT * FROM simulation.tb_act_coord_sample WHERE name = $1',
              values: [typname],
          }
          var client = await getClient();
          var result1 = await client.query(queryA);
          var result2 = await client.query(queryB);
          res.statusCode = 200;
          result1=result1.rows;
          result2=result2.rows;
          res.send({result1:result1,result2:result2});
          await client.end(); 
      })();

  }
  else if (charttyp=='finaltrack'){
      var nameTy=typname.split('_')[0].toUpperCase();
      var yearTy=typname.split('_')[1];
      
      (async () => {
        var query1 = {
          text: 'SELECT * FROM simulation.tb_final_track_prediction WHERE name = $1 ORDER BY ts ASC LIMIT 30',
          values: [typname],
        }
        var query2 = {
          text: 'SELECT ST_AsGeoJSON(geom) as geometry FROM typ_lines.aaline_'+typname+' ORDER BY id ASC'
        }
        const query3 = {
          text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
          values: [typname,yearTy],
        }
        var client = await getClient();
        var result1 = await client.query(query1);
        var result2 = await client.query(query2);
        var result3 = await client.query(query3);
        res.statusCode = 200;
        result1=result1.rows;
        result2=result2.rows;
        result3=result3.rows;
        name = typname; 
        //console.log(name);
        //console.log(result1.rows);
        var tmp1=FeatureCollection1(name,result1);
        var GeoJSONPoint = GeoJSON.parse(tmp1, { Point: ["lat", "lng"] });
        function FeatureCollection1(name,trackdata){
              var data=[];
              trackdata.forEach(function(el){
                data.push({lat:el.ycoord,lng:el.xcoord,name:name+'_(Prediction)'})
              });
              return data;
          }
        //console.log(result3);    
        tmp2=FeatureCollection2(name,result2);
        GeoJSONLine = GeoJSON.parse(tmp2,{'MultiLineString': 'line'});
        function FeatureCollection2(name,trackdata){
              var data=[];
              console.log(trackdata);
              trackdata.forEach(function(el){
                  koord=el.geometry.split('"coordinates":')[1].split('}')[0].substring(2).slice(0,-2);
                  x1=koord.split(',')[0].substring(1);
                  y1=koord.split(',')[1].slice(0,-1);
                  x2=koord.split(',')[2].substring(1);
                  y2=koord.split(',')[3].slice(0,-1);
                  //console.log(x1,x2,y1,y2);
                  data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:name+'_(Actual Condition)'})
              });
              console.log(data);
              return data;
        }
        console.log(tmp2);
        res.send({predictionPoint:GeoJSONPoint,actualLine:GeoJSONLine}); 
        //res.send({result1:result1,result2:result2});
        await client.end(); 
      })();
    }  
});

router.get('/simulationoption', function(req, res, next) {
  (async () => {
      const query1 = {
        text: 'SELECT * FROM simulation.tb_sample'
        }
      var client = await getClient();
      var result1 = await client.query(query1);
      res.statusCode = 200;
      res.send(result1.rows);     
      await client.end();
    })();
});


router.get('/typhoonsearch', function(req, res, next) {
  const query1a = {
    text: 'SELECT * FROM typ_sum.typ_p1'
  }
  const query1b = {
    text: 'SELECT * FROM typ_sum.typ_p2'
  }
    let output;
    client.query(query1a, (err, result1a) => {
      if (err) {
        console.log(err.stack)
      } else {
        namedataa=result1a.rows;
        var tmp=[];           
        namedataa.forEach(function(item,index){
          tmp.push(namedataa[index].name)          
        }) 
        client.query(query1b, (err, result1b) => {
          namedatab=result1b.rows;
          namedatab.forEach(function(item,index){
              tmp.push(namedatab[index].name)          
              
          })  
          console.log(tmp);
          namelist=tmp;
          res.send(namelist);   
        })
      }
    })
});

router.get('/searchline/:name', function(req, response, next) {
  const data = []
  var name = req.params.name;
  var nameTy=name.split('_')[0].toUpperCase();
  var yearTy=name.split('_')[1];  
  const query2 = {
    text: 'SELECT ST_AsGeoJSON(geom) as geometry FROM typ_lines.aaline_'+name+' ORDER BY id ASC'
  }
  const query3 = {
    text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
    values: [nameTy,yearTy],
  }
  client.query(query2, (err, result2d) => {
    if (err) {
      console.log(err.stack)
    } else {
      client.query(query3, (err, result3d) => {
        if (err) {
          console.log(err.stack)
        } else {
          trackdatad = result2d.rows;
          typhoonsumd = result3d.rows;
          tmp=FeatureCollection(name,trackdatad,typhoonsumd);
          dataGeoJSONc = GeoJSON.parse(tmp,{'MultiLineString': 'line'});
          console.log(dataGeoJSONc);
          response.send(dataGeoJSONc);     
        }
      })
    }   
  })
  function FeatureCollection(name,trackdata,typhoonsum){
      trackdata.forEach(function(el){
        koord=el.geometry.split('"coordinates":')[1].split('}')[0].substring(2).slice(0,-2);
        //console.log(koord);
        x1=koord.split(',')[0].substring(1);
        y1=koord.split(',')[1].slice(0,-1);
        x2=koord.split(',')[2].substring(1);
        y2=koord.split(',')[3].slice(0,-1);
        typhoonsum.forEach(function(el){
          data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:el.name+'_'+el.year})
        })
      });
      return data;
  }
});



//client.end()  

module.exports = router;
