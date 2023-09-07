import pyvista as pv
var='QCLOUD'
t=40

b = pv.read(var+"_"+str(t)+".vti")
c = b.extract_surface()
pl = pv.Plotter()
pl.add_mesh(c)
pl.export_gltf(var+"_"+str(t)+".gltf", save_normals=True, inline_data=True)
