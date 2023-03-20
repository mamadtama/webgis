var express = require('express');
var router = express.Router();
var http = require('http');
var fs = require('fs');
var url = require('url');
var GeoJSON = require('geojson');
const { Client } = require('pg')
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'donga2020',
  port: 5432,
})

client.connect(function(err) {
if (err) throw err;
console.log("Connected!");
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/toogle', function(req, res, next) {
  res.render('toogle', { title: 'Express' });
});

router.get('/test1', function(req, res, next) {
  res.render('test', { title: 'Express' });
});

router.get('/typhoon/:type/:direction/:name', function(req, res, next) {
	const data = []
    var type=req.params.type;
    var direction=req.params.direction;
    if (type=='point'){
        if (direction=="current"){
            const query1 = {
                text: 'SELECT * FROM typ_sum.typ_p2 ORDER BY id DESC'
            }
            function process(){
                let output;
                client.query(query1, (err, result1e) => {
                    if (err) {
                      console.log(err.stack)
                    } else {
                        name=result1e.rows[0].name
                        console.log(name);
                        var nameTy=name.split('_')[0].toUpperCase();
                        var yearTy=name.split('_')[1];  
                        const query2 = {
                          text: 'SELECT * FROM '+name,
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
                                name = name; 
                                trackdatad = result2d.rows;
                                typhoonsumd = result3d.rows;
                                tmp=FeatureCollection(name,trackdatad,typhoonsumd);
                                const dataGeoJSONd = GeoJSON.parse(tmp, { Point: ["lat", "lng"] });
                                res.send(dataGeoJSONd);     
                              }
                            })
                          }   
                        })
                    }
                })
              }
            process()
            function FeatureCollection(name,trackdata,typhoonsum){
                trackdata.forEach(function(el){
                  typhoonsum.forEach(function(el1){
                    data.push({lat:el.ycoord,lng:el.xcoord,name:name})
                  })
                });
                return data;
            }
        } else if (direction=="direct"){
            const data = [] 
            const query1 = {
                text: 'SELECT * FROM typ_sum.typ_p1'
            }
            function process(){
                let output;
                client.query(query1, (err, result1d) => {
                  if (err) {
                    console.log(err.stack)
                  } else {
                    namedatad=result1d.rows;
                    var tmpd=[];           
                    namedatad.forEach(function(item,index){
                      tmpd.push(namedatad[index].name)          
                    }) 
                    namelistd=tmpd;
                    setOutput(namelistd);
                  }
                })
                const setOutput = (rows) => {
                    output = rows;
                    //console.log(output);
                    n=0;
                    for (i=0; i<output.length;i++){
                      var name = output[i];
                      var nameTy=output[i].split('_')[0].toUpperCase();
                      var yearTy=output[i].split('_')[1];
                      const query2 = {
                        text: 'SELECT * FROM '+name,
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
                              name = name; 
                              trackdatad = result2d.rows;
                              typhoonsumd = result3d.rows;
                              tmp=FeatureCollection(name,trackdatad,typhoonsumd);
                              n=n+1;
                              if (n == (output.length)) {
                                    //console.log(tmp);
                                    const dataGeoJSONd = GeoJSON.parse(tmp, { Point: ["lat", "lng"] });
                                    res.send(dataGeoJSONd);     
                              }
                            }
                          })
                        }   
                      })
                    }
                }
              }
            process()
            function FeatureCollection(name,trackdata,typhoonsum){
                trackdata.forEach(function(el){
                  typhoonsum.forEach(function(el1){
                    data.push({lat:el.ycoord,lng:el.xcoord,name:name})
                  })
                });
                return data;
            }
        } else if (direction=="indirect"){
            const data = [] 
            const query1 = {
                text: 'SELECT * FROM typ_sum.typ_p2'
            }
            function process(){
                let output;
                client.query(query1, (err, result1) => {
                  if (err) {
                    console.log(err.stack)
                  } else {
                    namedatai=result1.rows;
                    var tmpi=[];           
                    namedatai.forEach(function(item,index){
                      tmpi.push(namedatai[index].name)          
                    }) 
                    namelisti=tmpi;
                    setOutput(namelisti);
                  }
                })
                const setOutput = (rows) => {
                    output = rows;
                    n=0;
                    for (i=0; i<output.length;i++){
                      var name = output[i];
                      var nameTy=output[i].split('_')[0].toUpperCase();
                      var yearTy=output[i].split('_')[1];
                      const query2 = {
                        text: 'SELECT * FROM '+name,
                      }
                      const query3 = {
                        text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
                        values: [nameTy,yearTy],
                      }
                      client.query(query2, (err, result2) => {
                        if (err) {
                          console.log(err.stack)
                        } else {
                          client.query(query3, (err, result3) => {
                            if (err) {
                              console.log(err.stack)
                            } else {
                              name = name; 
                              trackdata = result2.rows;
                              typhoonsum = result3.rows;
                              tmp=FeatureCollection(name,trackdata,typhoonsum);
                              n=n+1;
                              if (n == (output.length)) {
                                    const dataGeoJSONi = GeoJSON.parse(tmp, { Point: ["lat", "lng"] });
                                    res.send(dataGeoJSONi);
                              }
                            }
                          })
                        }   
                      })
                    }
                }
            }
            process()
            function FeatureCollection(name,trackdata,typhoonsum){
                trackdata.forEach(function(el){
                  typhoonsum.forEach(function(el1){
                    data.push({lat:el.ycoord,lng:el.xcoord,name:name})
                  })
                });
                return data;
            }
        } 
    } else if (type=='line'){
        if (direction=="current"){
            const query1 = {
                text: 'SELECT * FROM typ_sum.typ_p2 ORDER BY id DESC'
            }
            function process(){
                let output;
                client.query(query1, (err, result1e) => {
                    if (err) {
                      console.log(err.stack)
                    } else {
                        name=result1e.rows[0].name
                        console.log(name);
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
                                name = name; 
                                trackdatad = result2d.rows;
                                typhoonsumd = result3d.rows;
                                tmp=FeatureCollection(name,trackdatad,typhoonsumd);
                                dataGeoJSONc = GeoJSON.parse(tmp,{'MultiLineString': 'line'});
                                res.send(dataGeoJSONc);     
                              }
                            })
                          }   
                        })
                    }
                })
              }
            process();
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
                //console.log(data);
            }
        } else if (direction=="direct"){
            const data = [] 
            const query1 = {
                text: 'SELECT * FROM typ_sum.typ_p1'
            }
            function process(){
                let output;
                client.query(query1, (err, result1d) => {
                  if (err) {
                    console.log(err.stack)
                  } else {
                    namedatad=result1d.rows;
                    var tmpd=[];           
                    namedatad.forEach(function(item,index){
                      tmpd.push(namedatad[index].name)          
                    }) 
                    namelistd=tmpd;
                    setOutput(namelistd);
                  }
                })
                const setOutput = (rows) => {
                    output = rows;
                    //console.log(output);
                    n=0;
                    for (i=0; i<output.length;i++){
                      var name = output[i];
                      var nameTy=output[i].split('_')[0].toUpperCase();
                      var yearTy=output[i].split('_')[1];
                      //console.log(name);
                      const query2 = {
                        text: 'SELECT ST_AsGeoJSON(geom) as geometry FROM typ_lines.aaline_'+name+' ORDER BY id ASC',
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
                                    var trackdatac="";
                                    var typhoonsumc=""
                                    var dataGeoJSONc=[];
                                    trackdatac = result2d.rows;
                                    typhoonsumc = result3d.rows;
                                    //console.log(name);
                                    tmpc=FeatureCollection(name,trackdatac,typhoonsumc);
                                    n=n+1;
                                    if (n == (output.length)) {
                                        dataGeoJSONc = GeoJSON.parse(tmpc,{'MultiLineString': 'line'});
                                        res.send(dataGeoJSONc);
                                    }
                                }
                            })
                        }   
                      })
                    }
                }
              }
            process()
            function FeatureCollection(name,trackdata,typhoonsum){
                trackdata.forEach(function(el){
                  koord=el.geometry.split('"coordinates":')[1].split('}')[0].substring(2).slice(0,-2);
                  x1=koord.split(',')[0].substring(1);
                  y1=koord.split(',')[1].slice(0,-1);
                  x2=koord.split(',')[2].substring(1);
                  y2=koord.split(',')[3].slice(0,-1);
                  typhoonsum.forEach(function(el){
                    data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:el.name+'_'+el.year})
                  })
                });
                //console.log(data);
                return data;
            }
        } else if (direction=="indirect"){
            const data = [] 
            const query1 = {
                text: 'SELECT * FROM typ_sum.typ_p2'
            }
            function process(){
                let output;
                client.query(query1, (err, result1d) => {
                  if (err) {
                    console.log(err.stack)
                  } else {
                    namedatad=result1d.rows;
                    var tmpd=[];           
                    namedatad.forEach(function(item,index){
                      tmpd.push(namedatad[index].name)          
                    }) 
                    namelistd=tmpd;
                    setOutput(namelistd);
                  }
                })
                const setOutput = (rows) => {
                    output = rows;
                    //console.log(output);
                    n=0;
                    for (i=0; i<output.length;i++){
                      var name = output[i];
                      var nameTy=output[i].split('_')[0].toUpperCase();
                      var yearTy=output[i].split('_')[1];
                      const query2 = {
                        text: 'SELECT ST_AsGeoJSON(geom) as geometry FROM typ_lines.aaline_'+name+' ORDER BY id ASC',
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
                                    var trackdatac="";
                                    var typhoonsumc=""
                                    var dataGeoJSONc=[];
                                    trackdatac = result2d.rows;
                                    typhoonsumc = result3d.rows;
                                    tmpc=FeatureCollection(name,trackdatac,typhoonsumc);
                                    n=n+1;
                                    if (n == (output.length)) {
                                        dataGeoJSONc = GeoJSON.parse(tmpc,{'MultiLineString': 'line'});
                                        res.send(dataGeoJSONc);
                                    }
                                }
                            })
                        }   
                      })
                    }
                }
              }
            process()
            function FeatureCollection(name,trackdata,typhoonsum){
                trackdata.forEach(function(el){
                  koord=el.geometry.split('"coordinates":')[1].split('}')[0].substring(2).slice(0,-2);
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
          selection = {
          text: 'SELECT * FROM simulation.tb_ens_xclass WHERE name = $1',
          values: [typname],
        }
      } else if (coortyp=='ycoord'){
          selection = {
          text: 'SELECT * FROM simulation.tb_ens_yclass WHERE name = $1',
          values: [typname],
        }
      }
      client.query(selection, (err, result) => {
        if (err) {
          console.log(err.stack)
        } else {
              console.log(result.rows);
              res.send(result.rows);     
        }   
      })
    }
});

router.get('/allbusantyphoon', function(req, res, next) {
  const query1a = {
    text: 'SELECT * FROM typ_sum.typ_p1'
  }
  const query1b = {
    text: 'SELECT * FROM typ_sum.typ_p2'
  }
  function process(){
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
      //  console.log(tmp);
        
        client.query(query1b, (err, result1b) => {
			namedatab=result1b.rows;
			namedatab.forEach(function(item,index){
	    	    tmp.push(namedatab[index].name)          
		        
	        })  
	        console.log(tmp);
	        namelist=tmp;
		    setOutput(namelist);   
		})
      }
    })

    const setOutput = (rows) => {
        output = rows;
        n=0;
        for (i=0; i<output.length;i++){
          var name = output[i];
          var nameTy=output[i].split('_')[0].toUpperCase();
          var yearTy=output[i].split('_')[1];
          const query2 = {
            text: 'SELECT * FROM '+name,
          }
          const query3 = {
            text: 'SELECT * FROM typ_sum.typhoon_sum WHERE name = $1 AND year = $2',
            values: [nameTy,yearTy],
          }

          client.query(query2, (err, result2) => {
            if (err) {
              console.log(err.stack)
            } else {
              client.query(query3, (err, result3) => {
                if (err) {
                  console.log(err.stack)
                } else {
                  name = name; 
                  trackdata = result2.rows;
                  typhoonsum = result3.rows;
                  tmp=FeatureCollection(name,trackdata,typhoonsum);
                  n=n+1;
                  if (n == (output.length)) {
                  	    const dataGeoJSON = GeoJSON.parse(tmp, { Point: ["lat", "lng"] });
					    res.send(dataGeoJSON);
                  }
                }
              })
            }   
          })
        }
    }
  }
  process()
});

router.get('/curtyphoonline/:name', function(req, res, next) {

});





//client.end()  

module.exports = router;
