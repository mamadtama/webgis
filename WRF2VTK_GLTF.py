from vtk import vtkImageData
from vtk import vtkXMLImageDataWriter
from vtk import vtkFloatArray
import sys
import os
from netCDF4 import Dataset

var='QCLOUD'

t=40
wrffile = "/home/mamad/hdd/DOCTOR/wrfout/danas2019/wrfout_d01_2019-07-14_00:00:00"
newf = Dataset(wrffile)
data = newf.variables[var][t]
tim = newf.variables['Times'][t].copy().view('S19')[0]
print(str(tim))

nx = len(data[:][1][1]) #number of x grid
ny = len(data[1][:][1]) #number of y grid
nz = len(data[1][1][:]) #number of z grid
#print(nx,ny,nz)

# Create VTK data object.
vtk_image_data = vtkImageData()
vtk_image_data.SetExtent(0,nx,0,ny,0,34)

#with h5py.File(file, 'r') as f:
floatArray = vtkFloatArray()
floatArray.SetName(var)
floatArray.SetNumberOfComponents(1)
floatArray.SetNumberOfTuples(nx*ny*34)
index = 0
for x in range(nx-1):
    for y in range(ny-1):
        for z in range(34):
            floatArray.SetTuple1(index, data[z][x][y])
            index += 1
vtk_image_data.GetCellData().AddArray(floatArray)

# Write VTK data object.
writer = vtkXMLImageDataWriter()
#writer.SetFileName(f"vtk/{var}_{str(tim)}.vti")
writer.SetFileName(var+"_"+str(t)+".vti")
writer.SetInputData(vtk_image_data)
writer.Write()

import pyvista as pv
b = pv.read(var+"_"+str(t)+".vti")
c = b.extract_surface()
pl = pv.Plotter()
pl.add_mesh(c)
pl.export_gltf(var+"_"+str(t)+".gltf", save_normals=True, inline_data=True)
