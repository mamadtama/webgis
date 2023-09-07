import psycopg2
#from shapely.geometry import LineString
from shapely.geometry import  MultiLineString, mapping, shape
from shapely import wkb

dbname = '' #database_name
port = '' #port_number
user = '' #user
passwd = '' #password

typname='jangmi_2020' #typhoon name as written in database

conn = psycopg2.connect(dbname=dbname, port=port, user=user, password=passwd, host='localhost')
cursor = conn.cursor()

#----------------EXPORT TYPHOON TRACKS TO POSTGIS--------------------------------------    
def createLine(typname): 
    cursor.execute("""SELECT id FROM """+ typname +""" ORDER BY id ASC """)
    idlist = [item[0] for item in cursor.fetchall()] 
    cursor.execute("""SELECT xcoord FROM """+ typname +""" ORDER BY id ASC """)
    xlist = [item[0] for item in cursor.fetchall()] 
    cursor.execute("""SELECT ycoord FROM """+ typname +""" ORDER BY id ASC """)
    ylist = [item[0] for item in cursor.fetchall()]
    cursor.execute("""SELECT time FROM """+ typname +""" ORDER BY id ASC """)
    tlist = [item[0] for item in cursor.fetchall()] 
    cursor.execute('DROP TABLE IF EXISTS typ_lines.aaline_' + typname)
    cursor.execute("""CREATE TABLE typ_lines.aaline_"""+typname+"""(id int4, geom geometry, "time" int4)""")
    tempx=''
    tempy=''
    for i,(ID,x,y,t) in enumerate(zip(idlist,xlist,ylist,tlist)):
        if (not tempx=='') and (not tempy==''):
            ls = MultiLineString([((tempx, tempy), (float(x), float(y)))])
            ls.wkt  # LINESTRING Z (2.2 4.4 10.2, 3.3 5.5 8.4)
            ls.wkb_hex  # 0102000080020000009A999999999901409A999999999911406666666666662440666666...
            cursor.execute('INSERT INTO typ_lines.aaline_'+ typname +' (id,geom,time)'
            'VALUES (%(id)s, ST_SetSRID(%(geom)s::geometry, %(srid)s), %(time)s)', 
            {'id':ID,'geom': ls.wkb_hex, 'srid': 4326, 'time': t})   
        tempx=x
        tempy=y
    conn.commit()  # save data

createLine(typname)
