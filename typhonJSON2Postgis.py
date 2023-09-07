import lxml.html
from selenium import webdriver
import os 
import psycopg2
import json
import sys
from geojson import Point
import requests
import datetime

dbname = '' #database_name
port = '' #port_number
user = '' #user
passwd = '' #password
file_dir = ".../.." #Directory of typhoon files in GeoJSON format

conn = psycopg2.connect(dbname=dbname, port=port, user=user, password=passwd, host='localhost')
cursor = connection.cursor()

#----------------EXPORT TYPHOON TRACKS TO POSTGIS--------------------------------------    

print("Start to export the typhoon tracks to postgis....")
sortdate_list =[20050921]
typhoon_list=["DAMREY"]
year_list=[2005]

for a,b,c in zip(sortdate_list,typhoon_list,year_list):
    print('Creating table for typhoon track  of : -->' + str(a)+b)
    if "-" in b:
        b = b.split('-')[0] + b.split('-')[1]
    typhoon_file = str(a) + '-' + b
    tablename = b+"_"+str(c)
    cursor.execute('DROP TABLE IF EXISTS public.' + tablename)     #DROP TABLE TYPHOON TRACK IF EXIST AND CREATE  / DIRECTLY TABLE TYPHOON TRACK IF NOT EXIST       

    try:
        cursor.execute('CREATE TABLE public.' + tablename + ' (id integer PRIMARY KEY,geom geometry,time integer,wind real,class integer,display_time timestamp without time zone,pressure real,xcoord double precision,ycoord double precision)')
        with open(file_dir +'/'+ typhoon_file + '.json') as file:
            gj=json.load(file)
        for feature in gj['features']:
            displaydate0=feature['properties']['display_time'].split(' ')[0].split('-')[0]
            displaydate1=feature['properties']['display_time'].split(' ')[0].split('-')[1]
            displaydate2=feature['properties']['display_time'].split(' ')[0].split('-')[2]
            displaydateT=displaydate0+displaydate1+displaydate2
            display_time0=feature['properties']['display_time'].split(' ')[1].split(':')[0]
            idt=displaydateT + display_time0
            geom=(json.dumps(feature['geometry']))
            wind=feature['properties']['wind']
            time=feature['properties']['time']
            class1=feature['properties']['class']
            display_time=feature['properties']['display_time']
            pressure=feature['properties']['pressure']
            xcoord=feature['geometry']['coordinates'][0]
            ycoord=feature['geometry']['coordinates'][1]
            cursor.execute('INSERT INTO public.'+ tablename +' (id,geom,wind,time,class,display_time,pressure,xcoord,ycoord) VALUES (%s, ST_GeomFromText(ST_AsText(ST_GeomFromGeoJSON(%s)),4326), %s, %s, %s, %s, %s, %s, %s)', (idt,geom,wind,time,class1,display_time,pressure,xcoord,ycoord))   
    except:
        pass        
connection.commit()
