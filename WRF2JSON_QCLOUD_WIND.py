#command: wrffile, outroot, height

from __future__ import print_function, unicode_literals

import os
import json
import numpy as np
from netCDF4 import Dataset
import argparse
from argparse import RawDescriptionHelpFormatter
import metpy.calc as mpcalc
from metpy.units import units

parser = argparse.ArgumentParser(description = """earthjsonfromwrf.py
""", epilog = """
""", formatter_class = RawDescriptionHelpFormatter)
parser.add_argument('--lat', default = 'XLAT', dest = 'latitude_name', help = 'Name for latitude variable')
parser.add_argument('--lon', default = 'XLONG', dest = 'longitude_name', help = 'Name for longitude variable')

#getting height level
parser.add_argument('--Perturbation geopotential', default = 'PH', dest = 'PH_name', help = 'Name for Perturbation geopotential variable')
parser.add_argument('--Base-state geopotential', default = 'PHB', dest = 'PHB_name', help = 'Name for Base-state geopotential variable')

#parser.add_argument('-u', '--ucomponent', default = 'U10', dest = 'ucomponent', help = 'Name for u-component of wind')
#parser.add_argument('-v', '--vcomponent', default = 'V10', dest = 'vcomponent', help = 'Name for v-component of wind')

parser.add_argument('-u', '--ucomponent', default = 'U', dest = 'ucomponent', help = 'Name for u-component of wind')
parser.add_argument('-v', '--vcomponent', default = 'V', dest = 'vcomponent', help = 'Name for v-component of wind')
parser.add_argument('-qc', '--qc', default = 'QCLOUD', dest = 'qc', help = 'Cloud water mixing ratio in kg kg-1')

parser.add_argument('wrffile', help = 'Path to wrfout or wrfinput file that contains latitude_name, longitude_name, ucomponent, and vcomponent')
parser.add_argument('outroot', help = 'Path for output', default = '../public/data/weather/')
parser.add_argument('height', help = 'Variable height')

args = parser.parse_args()

height = int(args.height) #1
outroot = args.outroot

print(height)

uhdr = {"header":{"discipline":0,"disciplineName":"Meteorological products","gribEdition":2,"gribLength":131858,"center":0,"centerName":"WRF OUTPUT","subcenter":0,"refTime":"2014-01-31T00:00:00.000Z","significanceOfRT":1,"significanceOfRTName":"Start of forecast","productStatus":0,"productStatusName":"Operational products","productType":1,"productTypeName":"Forecast products","productDefinitionTemplate":0,"productDefinitionTemplateName":"Analysis/forecast at horizontal level/layer at a point in time","parameterCategory":2,"parameterCategoryName":"Momentum","parameterNumber":2,"parameterNumberName":"U-component_of_wind","parameterUnit":"m.s-1","genProcessType":2,"genProcessTypeName":"Forecast","forecastTime":3,"surface1Type":103,"surface1TypeName":"Specified height level above ground","surface1Value":10,"surface2Type":255,"surface2TypeName":"Missing","surface2Value":0,"gridDefinitionTemplate":0,"gridDefinitionTemplateName":"Latitude_Longitude","numberPoints":65160,"shape":6,"shapeName":"Earth spherical with radius of 6,371,229.0 m","gridUnits":"degrees","resolution":48,"winds":"true","scanMode":0,"nx":360,"ny":181,"basicAngle":0,"subDivisions":0,"lo1":0,"la1":90,"lo2":359,"la2":-90,"dx":1,"dy":1}}
vhdr = {"header":{"discipline":0,"disciplineName":"Meteorological products","gribEdition":2,"gribLength":131858,"center":0,"centerName":"WRF OUTPUT","subcenter":0,"refTime":"2014-01-31T00:00:00.000Z","significanceOfRT":1,"significanceOfRTName":"Start of forecast","productStatus":0,"productStatusName":"Operational products","productType":1,"productTypeName":"Forecast products","productDefinitionTemplate":0,"productDefinitionTemplateName":"Analysis/forecast at horizontal level/layer at a point in time","parameterCategory":2,"parameterCategoryName":"Momentum","parameterNumber":3,"parameterNumberName":"V-component_of_wind","parameterUnit":"m.s-1","genProcessType":2,"genProcessTypeName":"Forecast","forecastTime":3,"surface1Type":103,"surface1TypeName":"Specified height level above ground","surface1Value":10,"surface2Type":255,"surface2TypeName":"Missing","surface2Value":0,"gridDefinitionTemplate":0,"gridDefinitionTemplateName":"Latitude_Longitude","numberPoints":65160,"shape":6,"shapeName":"Earth spherical with radius of 6,371,229.0 m","gridUnits":"degrees","resolution":48,"winds":"true","scanMode":0,"nx":360,"ny":181,"basicAngle":0,"subDivisions":0,"lo1":0,"la1":90,"lo2":359,"la2":-90,"dx":1,"dy":1}}
phhdr = {"header":{"discipline":0,"disciplineName":"Meteorological products","gribEdition":2,"gribLength":131858,"center":0,"centerName":"WRF OUTPUT","subcenter":0,"refTime":"2014-01-31T00:00:00.000Z","significanceOfRT":1,"significanceOfRTName":"Start of forecast","productStatus":0,"productStatusName":"Operational products","productType":1,"productTypeName":"Forecast products","productDefinitionTemplate":0,"productDefinitionTemplateName":"Analysis/forecast at horizontal level/layer at a point in time","parameterCategory":2,"parameterCategoryName":"Momentum","parameterNumber":4,"parameterNumberName":"Perturbation geopotential","parameterUnit":"m2 s-2","genProcessType":2,"genProcessTypeName":"Forecast","forecastTime":3,"surface1Type":103,"surface1TypeName":"Specified height level above ground","surface1Value":10,"surface2Type":255,"surface2TypeName":"Missing","surface2Value":0,"gridDefinitionTemplate":0,"gridDefinitionTemplateName":"Latitude_Longitude","numberPoints":65160,"shape":6,"shapeName":"Earth spherical with radius of 6,371,229.0 m","gridUnits":"degrees","resolution":48,"winds":"true","scanMode":0,"nx":360,"ny":181,"basicAngle":0,"subDivisions":0,"lo1":0,"la1":90,"lo2":359,"la2":-90,"dx":1,"dy":1}}
phbhdr = {"header":{"discipline":0,"disciplineName":"Meteorological products","gribEdition":2,"gribLength":131858,"center":0,"centerName":"WRF OUTPUT","subcenter":0,"refTime":"2014-01-31T00:00:00.000Z","significanceOfRT":1,"significanceOfRTName":"Start of forecast","productStatus":0,"productStatusName":"Operational products","productType":1,"productTypeName":"Forecast products","productDefinitionTemplate":0,"productDefinitionTemplateName":"Analysis/forecast at horizontal level/layer at a point in time","parameterCategory":2,"parameterCategoryName":"Momentum","parameterNumber":5,"parameterNumberName":"Base-state geopotential","parameterUnit":"m2 s-2","genProcessType":2,"genProcessTypeName":"Forecast","forecastTime":3,"surface1Type":103,"surface1TypeName":"Specified height level above ground","surface1Value":10,"surface2Type":255,"surface2TypeName":"Missing","surface2Value":0,"gridDefinitionTemplate":0,"gridDefinitionTemplateName":"Latitude_Longitude","numberPoints":65160,"shape":6,"shapeName":"Earth spherical with radius of 6,371,229.0 m","gridUnits":"degrees","resolution":48,"winds":"true","scanMode":0,"nx":360,"ny":181,"basicAngle":0,"subDivisions":0,"lo1":0,"la1":90,"lo2":359,"la2":-90,"dx":1,"dy":1}}
qchdr = {"header":{"discipline":0,"disciplineName":"Meteorological products","gribEdition":2,"gribLength":131858,"center":0,"centerName":"WRF OUTPUT","subcenter":0,"refTime":"2014-01-31T00:00:00.000Z","significanceOfRT":1,"significanceOfRTName":"Start of forecast","productStatus":0,"productStatusName":"Operational products","productType":1,"productTypeName":"Forecast products","productDefinitionTemplate":0,"productDefinitionTemplateName":"Analysis/forecast at horizontal level/layer at a point in time","parameterCategory":2,"parameterCategoryName":"Momentum","parameterNumber":8,"parameterNumberName":"Q cloud  in kg/kg-1","parameterUnit":"ms-1","genProcessType":2,"genProcessTypeName":"Forecast","forecastTime":3,"surface1Type":103,"surface1TypeName":"Specified height level above ground","surface1Value":10,"surface2Type":255,"surface2TypeName":"Missing","surface2Value":0,"gridDefinitionTemplate":0,"gridDefinitionTemplateName":"Latitude_Longitude","numberPoints":65160,"shape":6,"shapeName":"Earth spherical with radius of 6,371,229.0 m","gridUnits":"degrees","resolution":48,"winds":"true","scanMode":0,"nx":360,"ny":181,"basicAngle":0,"subDivisions":0,"lo1":0,"la1":90,"lo2":359,"la2":-90,"dx":1,"dy":1}}

data = [uhdr,vhdr,phhdr,phbhdr,qchdr]

newf = Dataset(args.wrffile)
#g = 9.81 # in m/s2

temp = newf.variables[args.latitude_name][0]
lat = np.flipud(temp)

lon = newf.variables[args.longitude_name][0]

dys = np.diff(lat, axis = 0).mean(1)
dy = float(dys.mean())*-1
print('Latitude Error:', np.abs((dy / dys) - 1).max())
print('Latitude Sum Error:', (dy / dys - 1).sum())
dxs = np.diff(lon, axis = 1).mean(0)
dx = float(dxs.mean())
print('Longitude Error:', np.abs(dx / dxs - 1).max())
print('Longitude Sum Error:', (dx / dxs - 1).sum())
nx = float(lon.shape[1])
ny = float(lat.shape[0])
la1 = float(lat[0, 0])
la2 = float(lat[-1, -1])
lo1 = float(lon[0, 0])
lo2 = float(lon[-1, -1])
times = newf.variables['Times'][:].copy().view('S19')

for ti, time in enumerate(times):
    #2012/02/07/0100Z/wind/surface/level/orthographic=-74.01,4.38,29184
    datestr = (time[0][:10]).decode('ascii').replace('-', '/')
    timestr = (time[0][11:13]).decode('ascii') + '00'
    print('Add "#' + datestr + '/' + timestr + 'Z/wind/surface/level/orthographic" to url to see this time')
    dirpath = os.path.join(args.outroot, *datestr.split('/'))
    os.makedirs(dirpath, exist_ok = True)
    outpath = os.path.join(dirpath, '%s-wind-surface-level-wrf-1.0.json' % (timestr,))

    for u0_or_v1 in [0, 1, 2, 3, 4]:
        # Update header data for some properties
        # that are now to affect.
        h = data[u0_or_v1]['header']
        h['extent'] = [lo1,la2,lo2,la1]
        h['la1'] = la1
        h['la2'] = la2
        h['lo1'] = lo1
        h['lo2'] = lo2
        h['nx'] = nx
        h['ny'] = ny
        h['dx'] = dx
        h['dy'] = dy
        h['z'] = height
        h['forecastTime'] = 0
        h['refTime'] = time[0].decode('ascii').replace('_', 'T') + '.000Z'
        #"2014-01-31T00:00:00.000Z"
        
        h['gribLength'] = 1538 + nx * ny * 2
        if u0_or_v1 == 0:
            tempu = newf.variables[args.ucomponent][ti][height]
            temp = np.flipud(tempu)
            data[u0_or_v1]['data'] = temp.ravel().tolist()
        elif u0_or_v1 == 1:
            tempv = newf.variables[args.vcomponent][ti][height]
            temp = np.flipud(tempv)
            data[u0_or_v1]['data'] = temp.ravel().tolist()
        elif u0_or_v1 == 2:
            temp0 = newf.variables[args.PH_name][ti][height]
            temp = np.flipud(temp0)
            data[u0_or_v1]['data'] = temp.ravel().tolist()
        elif u0_or_v1 == 3:
            temp0 = newf.variables[args.PHB_name][ti][height]
            temp = np.flipud(temp0)
            data[u0_or_v1]['data'] = temp.ravel().tolist()
        elif u0_or_v1 == 4:
            temp0 = newf.variables[args.qc][ti][height]
            temp1 = np.flipud(temp0)
            #temp = np.rot90(temp1)
            data[u0_or_v1]['data'] = temp1.ravel().tolist() 
                               
    if ti == 0:
        outf = open(outpath, 'w')
        json.dump(data, outf)
        outf.close()
        
    outf = open(outpath, 'w')
    json.dump(data, outf)
    outf.close()