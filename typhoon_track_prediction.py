import pandas as pd
import psycopg2
import sys
import pandas.io.sql as psql
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
import math

cur_typ=sys.argv[1]  #"haishen_2020"
knn=sys.argv[2] #choose the number of k in k-NN algorithm 

dbname = '' #database_name
port = '' #port_number
user = '' #user
passwd = '' #password

output_files='/' #Directory for storing the prediction evaluation 

connection = psycopg2.connect(dbname=dbname, port=port, user=user, password=passwd, host='localhost')
cursor = connection.cursor()

def process(cur_name,data_cur,knn,ti,ts):

    #------------------data initialization---------------------------------
    print('Data initialization...')
    query="""SELECT name,birthdate,year FROM typ_sum.typhoon_sum"""
    typ_sum = psql.read_sql(query, connection)

    query="""SELECT name,id,year FROM typ_sum.typ_p1""" #querying typhoon information (name, id, year) that directly passes through a case area.
    p1 = psql.read_sql(query, connection)
    query="""SELECT name,id,year FROM typ_sum.typ_p2""" #querying typhoon information (name, id, year) that indirectly passes through a case area.
    p2 = psql.read_sql(query, connection)
    butyp=p1.append(p2)
    da1=pd.DataFrame(columns=['name','birthdate','year'])
    for i,name in enumerate(butyp['name']):
        namea=name.split('_')[0]
        year=name.split('_')[1]
        da=typ_sum[(typ_sum['name']==namea.upper()) & (typ_sum['year']==float(year))]        
        da1=da1.append(da)    
    
    da1.drop_duplicates(subset=['name','year'], keep='first',inplace=True)
    da1=da1[da1['birthdate']<bir_date]

    data_init={}
    for name,year in zip(da1['name'],da1['year']):
        namea=name.lower()
        name=namea+'_'+str(year)
        query="""SELECT xcoord,ycoord FROM """+name
        data_init[name] = psql.read_sql(query, connection)
    
    #------------------starting point---------------------------------    
    print('Starting point....')

    data_sp={}
    for data in data_init:
        dataty=data_init[data]
        data_sp[data] = dataty[dataty['ycoord']>=min(data_cur['ycoord'])]
        data_sp[data] = data_sp[data].reset_index()
        data_sp[data]=data_sp[data].drop(data_sp[data].columns[0], axis=1)
        data_sp[data].insert(0, 't', range(1, 1 + len(data_sp[data])))

    #------------------Filtering the typhoons that are far to the current typhoon---------------------------------    
    
    ave_cur=data_cur['xcoord'].head(25).mean()
    ty_red=[]
    for data in data_sp:
        ave_his=data_sp[data]['xcoord'].head(25).mean()
        print(abs(ave_his-ave_cur))
        if abs(ave_his-ave_cur)>6:
            ty_red.append(data)        

    for data in ty_red:        
        data_sp.pop(data,None)       

    #------------------Dividing the class 'left' and 'right'---------------------------------    
    print('Dividing the class... ')

    data_cur_head=data_cur.head(ti)
    data_cur_head.insert(0, 't', range(1, 1 + len(data_cur_head)))
    ave_cur=data_cur['xcoord'].mean()
    data_g={}
    for data in data_sp:
        ave_his=data_sp[data]['xcoord'].head(5).mean()
        if ave_his<ave_cur:
            data_sp[data]['class']='left'       
        elif ave_his>ave_cur:
            data_sp[data]['class']='right'

    def prediction(data_sp,coord_typ,knn,ts):
        dataL = {}
        for data in data_sp:
            if data_sp[data]['class'][0] == 'left':
                dataL[data]=data_sp[data]
        
        dataR = {}
        for data in data_sp:
            if data_sp[data]['class'][0] == 'right':
                dataR[data]=data_sp[data]

        data_en_zo_coord={}
        data_en_zo_class={}

        for datale in dataL:
            for datari in dataR:
                if not dataL == dataR:
                    data_en_zo_coord[datale+"_"+datari]=pd.DataFrame(columns=['tl','tr','tc','left','current','right'])
                    data_en_zo_coord[datale+"_"+datari]['left']=dataL[datale][coord_typ]
                    data_en_zo_coord[datale+"_"+datari]['tl']=dataL[datale]['t']
                    data_en_zo_coord[datale+"_"+datari]['right']=dataR[datari][coord_typ]
                    data_en_zo_coord[datale+"_"+datari]['tr']=dataR[datari]['t']
                    data_en_zo_coord[datale+"_"+datari]['current']=data_cur_head[coord_typ]
                    data_en_zo_coord[datale+"_"+datari]['tc']=data_cur_head['t']
                    L_coord=dataL[datale][coord_typ]
                    R_coord=dataR[datari][coord_typ]
                    Cur_coord=data_cur_head[coord_typ]

                    data_en_zo_class[datale+"_"+datari]=pd.DataFrame(columns=['tl','tr','tc','left','current','right'])
                    data_en_zo_class[datale+"_"+datari]['left']=dataL[datale]['class']
                    data_en_zo_class[datale+"_"+datari]['tl']=dataL[datale]['t']
                    data_en_zo_class[datale+"_"+datari]['right']=dataR[datari]['class']
                    data_en_zo_class[datale+"_"+datari]['tr']=dataR[datari]['t']
                    data_en_zo_class[datale+"_"+datari]['tc']=data_cur_head['t']
                    for i in range(0,len(data_cur_head)):
                        d_L = L_coord[i] + abs(Cur_coord[i]-L_coord[i])/4 
                        d_R = R_coord[i] - abs(R_coord[i]-Cur_coord[i])/4
                        if Cur_coord[i] > L_coord[i] and Cur_coord[i] < Cur_coord[i]+d_L: 
                            data_en_zo_class[datale+"_"+datari].loc[i,'current']='left'               
                        elif Cur_coord[i] > (R_coord[i]-d_R) and Cur_coord[i] < R_coord[i]: 
                            data_en_zo_class[datale+"_"+datari].loc[i,'current']='right'    
                        else:    
                            data_en_zo_class[datale+"_"+datari].loc[i,'current']='center'
       
        #--Arranging the training dataset for classification
        train_class={}
        for data in data_en_zo_class:
            train_class[data]=pd.DataFrame(columns=['t','class'])
            k=0
            for i in range (0, len(data_en_zo_coord[data])):
                train_class[data].loc[k,'t']=data_en_zo_class[data]['tl'].loc[i]
                train_class[data].loc[k,'class']=data_en_zo_class[data]['left'].loc[i]
                train_class[data].loc[k+1,'t']=data_en_zo_class[data]['tc'].loc[i]
                train_class[data].loc[k+1,'class']=data_en_zo_class[data]['current'].loc[i]
                train_class[data].loc[k+2,'t']=data_en_zo_class[data]['tr'].loc[i]
                train_class[data].loc[k+2,'class']=data_en_zo_class[data]['right'].loc[i]
                k=k+3
            train_class[data].dropna(subset = ["class"], inplace=True)    

        #Prediction of current class using k-NN Classifier      
        pred_class={}
        for data in train_class:
            pred_class[data]=pd.DataFrame(columns=['t','class'])
            nt=25
            t_test0 = [i for i in range(1,nt)]
            t_test = [[i] for i in range(1,nt)]
            t_train=[[i] for i in train_class[data]['t']]
            x_train=[[i] for i in train_class[data]['class']]
            reg = KNeighborsClassifier(n_neighbors=knn)
            reg.fit(t_train,x_train)   
            x_pred=reg.predict(t_test)
            pred_class[data]['t']=t_test0
            pred_class[data]['class']=x_pred 

        #Pandasframe for class determination of current typhoon
        pred_class_f=pd.DataFrame(columns=['ensemble','class'])
        i=0
        for data in pred_class:
            nl=pred_class[data].loc[pred_class[data]['class'] == 'left', 'class'].count()
            nr=pred_class[data].loc[pred_class[data]['class']=='right','class'].count()
            nc=pred_class[data].loc[pred_class[data]['class']=='center','class'].count()
            if nl > nr and nl > nc:
                classa='left'
                pred_class_f.loc[i]=[data]+[classa]
            elif nr > nl and nr > nc:
                classa='right'
                pred_class_f.loc[i]=[data]+[classa]
            elif nc > nl and nc > nr:
                classa='center'
                pred_class_f.loc[i]=[data]+[classa]   
                 
            i=i+1    

        #--Arranging the training dataset for regression
        train_reg={}
        for data,classen in zip(pred_class_f['ensemble'],pred_class_f['class']):
            train_reg[data]=pd.DataFrame(columns=['t',coord_typ])
            print(data,classen)
            k=0
            if classen=='center':
                for i in range (0, len(data_en_zo_coord[data])):
                    train_reg[data].loc[k,'t']=data_en_zo_coord[data]['tl'].loc[i]
                    train_reg[data].loc[k,coord_typ]=data_en_zo_coord[data]['left'].loc[i]
                    train_reg[data].loc[k+1,'t']=data_en_zo_coord[data]['tc'].loc[i]
                    train_reg[data].loc[k+1,coord_typ]=data_en_zo_coord[data]['current'].loc[i]
                    train_reg[data].loc[k+2,'t']=data_en_zo_coord[data]['tr'].loc[i]
                    train_reg[data].loc[k+2,coord_typ]=data_en_zo_coord[data]['right'].loc[i]
                    k=k+3
            elif classen=='left':
                for i in range (0, len(data_en_zo_coord[data])):
                    train_reg[data].loc[k,'t']=data_en_zo_coord[data]['tl'].loc[i]
                    train_reg[data].loc[k,coord_typ]=data_en_zo_coord[data]['left'].loc[i]
                    train_reg[data].loc[k+1,'t']=data_en_zo_coord[data]['tc'].loc[i]
                    train_reg[data].loc[k+1,coord_typ]=data_en_zo_coord[data]['current'].loc[i]
                    k=k+2
            elif classen=='right':
                for i in range (0, len(data_en_zo_coord[data])):
                    train_reg[data].loc[k,'t']=data_en_zo_coord[data]['tr'].loc[i]
                    train_reg[data].loc[k,coord_typ]=data_en_zo_coord[data]['right'].loc[i]
                    train_reg[data].loc[k+1,'t']=data_en_zo_coord[data]['tc'].loc[i]
                    train_reg[data].loc[k+1,coord_typ]=data_en_zo_coord[data]['current'].loc[i]
                    k=k+2                
            train_reg[data].dropna(subset = [coord_typ], inplace=True)     
                    
        #Prediction of zonal coordinate     
        pred_reg={}
        for data in train_reg:
            pred_reg[data]=pd.DataFrame(columns=['t',coord_typ])
            nt=ts
            t_test0 = [i for i in range(1,nt)]
            t_test = [[i] for i in range(1,nt)]
            t_train=[[i] for i in train_reg[data]['t']]
            x_train=[[i] for i in train_reg[data][coord_typ]]

            reg = KNeighborsRegressor(n_neighbors=knn)
            reg.fit(t_train,x_train)   
            x_pred=reg.predict(t_test)
            pred_reg[data]['t']=t_test0
            pred_reg[data][coord_typ]=x_pred 
        return pred_reg   

    #Calculation of ensemble averaging 
    print('Calculating the prediction for zonal component...')
    pred_zonal=prediction(data_sp,'xcoord',knn,ts)
    print('Calculating the prediction for meridional component...')
    pred_meridional=prediction(data_sp,'ycoord',knn,ts)

    #-----zonal coordinate-----------------
    en_zo=pd.DataFrame()
    zo_weight=pd.DataFrame(columns=['ensemble','weight'])
    i=0
    for data in pred_zonal:
        en_zo['t']=pred_zonal[data]['t']
        en_zo[data]=pred_zonal[data]['xcoord']
        distance=data_cur['xcoord'].head(5).mean()-en_zo[data].head(5).mean()
        zo_weight.loc[i,'ensemble']=data
        zo_weight.loc[i,'weight']=distance
        i=i+1       
    temp=en_zo.drop('t',1)
    en_zo['mean']=temp.mean(axis=1) 
    en_zo['median']=temp.median(axis=1)
    w_temp=pd.DataFrame()
    i=0
    for data in temp:
        wei=zo_weight['weight'].loc[i]
        w_temp.insert(loc=i,column=data, value=[val+(0.75*wei) for val in temp[data]])
        i=i+1
    en_zo.dropna(axis=1,how='all')
    en_zo['weight_average']=w_temp.mean(axis=1)

    #---choosing the closest typhoon
    idx=zo_weight[zo_weight['weight']==zo_weight['weight'].min()]
    idx=idx['ensemble'].iloc[0]
    en_zo['closest_ty']=temp[idx]

    #-----meridional coordinate-----------------  
    en_me=pd.DataFrame()
    me_weight=pd.DataFrame(columns=['ensemble','weight'])
    i=0
    for data in pred_meridional:
        en_me['t']=pred_meridional[data]['t']
        en_me[data]=pred_meridional[data]['ycoord']
        distance=data_cur['ycoord'].head(5).mean()-en_me[data].head(5).mean()
        me_weight.loc[i,'ensemble']=data
        me_weight.loc[i,'weight']=distance
        i=i+1       
    temp=en_me.drop('t',1)
    en_me['mean']=temp.mean(axis=1) 
    en_me['median']=temp.median(axis=1)
    w_temp=pd.DataFrame()
    i=0
    for data in temp:
        wei=me_weight['weight'].loc[i]
        w_temp.insert(loc=i,column=data, value=[val+(0.75*wei) for val in temp[data]])
        i=i+1
    en_me['weight_average']=w_temp.mean(axis=1) 

    #---choosing the closest typhoon
    idx=me_weight[me_weight['weight']==me_weight['weight'].min()]
    idx=idx['ensemble'].iloc[0]
    en_me['closest_ty']=temp[idx]

    #Calculation of Error to the actual condition
    print('Calculating the track error ...')
    ACT = data_cur
    ACT.insert(loc=0, column='t', value = [i for i in range(1,len(ACT)+1)])
    ACT.drop(ACT.tail(1).index,inplace=True)

    erda_zo=pd.DataFrame()
    erda_zo.insert(loc=0, column='t', value = [i for i in range(1,ts)])
    data_mean_error=[round(abs(acx-zo),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['mean'],en_me['mean']))]
    data_mean_error_km=[val*111 for val in data_mean_error]
    erda_zo.insert(loc=1, column='mean_err', value = data_mean_error)
    erda_zo.insert(loc=2, column='mean_err_km', value = data_mean_error_km)
    data_median_error=[round(abs(acx-zo),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['median'],en_me['median']))]
    data_median_error_km=[val*111 for val in data_median_error]
    erda_zo.insert(loc=3, column='median_err', value = data_median_error)
    erda_zo.insert(loc=4, column='median_err_km', value = data_median_error_km)
    data_weight_error=[round(abs(acx-zo),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['weight_average'],en_me['weight_average']))]
    data_weight_error_km=[val*111 for val in data_weight_error]
    erda_zo.insert(loc=5, column='weight_ave_err', value = data_weight_error)
    erda_zo.insert(loc=6, column='weight_ave_err_km', value = data_weight_error_km)
    data_clos_error=[round(abs(acx-zo),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['closest_ty'],en_me['closest_ty']))]
    data_clos_error_km=[val*111 for val in data_clos_error]
    erda_zo.insert(loc=7, column='clos_typ_err', value = data_clos_error)
    erda_zo.insert(loc=8, column='clos_typ_err_km', value = data_clos_error_km)    

    erda_me=pd.DataFrame()
    erda_me.insert(loc=0, column='t', value = [i for i in range(1,ts)])
    data_mean_error=[round(abs(acy-me),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['mean'],en_me['mean']))]
    data_mean_error_km=[val*111 for val in data_mean_error]
    erda_me.insert(loc=1, column='mean_err', value = data_mean_error)
    erda_me.insert(loc=2, column='mean_err_km', value = data_mean_error_km)
    data_median_error=[round(abs(acy-me),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['median'],en_me['median']))]
    data_median_error_km=[val*111 for val in data_median_error]
    erda_me.insert(loc=3, column='median_err', value = data_median_error)
    erda_me.insert(loc=4, column='median_err_km', value = data_median_error_km)
    data_weight_error=[round(abs(acy-me),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['weight_average'],en_me['weight_average']))]
    data_weight_error_km=[val*111 for val in data_weight_error]
    erda_me.insert(loc=5, column='weight_ave_err', value = data_weight_error)
    erda_me.insert(loc=6, column='weight_ave_err_km', value = data_weight_error_km)
    data_clos_error=[round(abs(acy-me),3) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['closest_ty'],en_me['closest_ty']))]
    data_clos_error_km=[val*111 for val in data_clos_error]
    erda_me.insert(loc=7, column='clos_typ_err', value = data_clos_error)
    erda_me.insert(loc=8, column='clos_typ_err_km', value = data_clos_error_km)    
    print(erda_me)

    erda=pd.DataFrame()
    erda.insert(loc=0, column='t', value = [i for i in range(1,ts)])
    data_mean_error=[math.sqrt((acx-zo)**2+(acy-me)**2) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['mean'],en_me['mean']))]
    data_mean_error_km=[val*111 for val in data_mean_error]
    erda.insert(loc=1, column='mean_err', value = data_mean_error)
    erda.insert(loc=2, column='mean_err_km', value = data_mean_error_km)
    data_median_error=[math.sqrt((acx-zo)**2+(acy-me)**2) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['median'],en_me['median']))]
    data_median_error_km=[val*111 for val in data_median_error]
    erda.insert(loc=3, column='median_err', value = data_median_error)
    erda.insert(loc=4, column='median_err_km', value = data_median_error_km)
    data_weight_error=[math.sqrt((acx-zo)**2+(acy-me)**2) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['weight_average'],en_me['weight_average']))]
    data_weight_error_km=[val*111 for val in data_weight_error]
    erda.insert(loc=5, column='weight_ave_err', value = data_weight_error)
    erda.insert(loc=6, column='weight_ave_err_km', value = data_weight_error_km)
    data_clos_error=[math.sqrt((acx-zo)**2+(acy-me)**2) for i,(acx,acy,zo,me) in enumerate(zip(ACT['xcoord'],ACT['ycoord'],en_zo['closest_ty'],en_me['closest_ty']))]
    data_clos_error_km=[val*111 for val in data_clos_error]
    erda.insert(loc=7, column='clos_typ_err', value = data_clos_error)
    erda.insert(loc=8, column='clos_typ_err_km', value = data_clos_error_km)    

    print(erda)
    erda.to_csv(output_files+'error-'+cur_typ+'-knn-'+str(knn)+'.csv')

print('typhoon sample : ' + cur_typ)

query="""SELECT xcoord, ycoord, display_time FROM """ + cur_typ #+ """ ORDER BY time id"""
data_cur = psql.read_sql(query, connection)
bir_date = str(data_cur['display_time'][0]).split(' ')[0]
data_cur = data_cur.drop('display_time', 1)

knn=int(knn)
ti=8
ts=24

process(cur_typ,data_cur,knn,ti,ts)


