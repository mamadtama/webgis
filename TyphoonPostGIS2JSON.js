(async () => {
  var client = await getClient();
  var query4 = {
    text: 'SELECT ST_AsGeoJSON(geom) as geometry FROM hagupit_2020 ORDER BY time ASC'
  }
  var result4 = await client.query(query4);
  result4=result4.rows;
  tmp4=FeatureCollection2(result4);
  GeoJSONLineP = GeoJSON.parse(tmp4,{'MultiLineString': 'line'});
  res.send({ActualLine:GeoJSONLineP}); 

  function FeatureCollection2(trackdata){
        var data=[];
        console.log(trackdata);
        trackdata.forEach(function(el){
            koord=el.geometry.split('"coordinates":')[1].split('}')[0].substring(2).slice(0,-2);
            x1=koord.split(',')[0].substring(1);
            y1=koord.split(',')[1].slice(0,-1);
            x2=koord.split(',')[2].substring(1);
            y2=koord.split(',')[3].slice(0,-1);
            //console.log(x1,x2,y1,y2);
            data.push({line:[[[parseFloat(x1),parseFloat(y1)],[parseFloat(x2),parseFloat(y2)]]],name:'hagupit2020_(Actual)'})
        });
        console.log(data);
        return data;
  }
  await client.end(); 
})();

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