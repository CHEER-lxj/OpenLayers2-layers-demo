/**
 * 地图相关工具类
 */
var GisUtil ={};

var RESOLUTIONS= [
        1.40625, 
        0.703125, 
        0.3515625, 
        0.17578125, 
        0.087890625, 
        0.0439453125,
        0.02197265625, 
        0.010986328125, 
        0.0054931640625, 
        0.00274658203125,
        0.001373291015625, 
        0.0006866455078125, 
        0.00034332275390625,
        0.000171661376953125, 
        0.0000858306884765625, 
        0.00004291534423828125,
        0.00002145767211914062, 
        0.00001072883605957031,
        0.00000536441802978515, 
        0.00000268220901489257,
        0.0000013411045074462891,
        0.00000067055225372314453
    ];
var M_RESOLUTIONS= [
        156543.03390625, 78271.516953125, 39135.7584765625,
        19567.87923828125, 9783.939619140625, 4891.9698095703125,
        2445.9849047851562, 1222.9924523925781, 611.4962261962891,
        305.74811309814453, 152.87405654907226, 76.43702827453613,
        38.218514137268066, 19.109257068634033, 9.554628534317017,
        4.777314267158508, 2.388657133579254, 1.194328566789627,
        0.5971642833948135, 0.29858214169740677, 0.14929107084870338,
        0.07464553542435169
    ];

var  PGIS_RESOLUTIONS =[
    //度/px  					单图经度 跨度 × 256  512递推
	 2							//0		787996801.3191216377952755905508
	 ,1							//1		393998400.6595608188976377952754
	 ,0.5						//2		196999200.32978040944881889763772
	 ,0.25						//3		98499600.164890204724409448818868
	 ,0.125						//4		49249800.082445102362204724409434
	 ,0.0625					//5		24624900.041222551181102362204717	2000000.0-4000000.0
	 ,0.03125					//6		12312450.020611275590551181102364	1000000.0-2000000.0
	 ,0.015625					//7		6156225.0103056377952755905511819	500000.0-1000000.0
	 ,0.0078125					//8		3078112.5051528188976377952755909	200000.0-500000.0
	 ,0.00390625				//9		1539056.2525763881889763779527561	100000.0-200000.0
	 ,0.001953125				//10	769528.12628819409448818897637805	500000.0-1000000.0
	 ,0.0009765625				//11	384764.06314411299212598425196855	200000.0-500000.0	
	 ,0.00048828125				//12	192382.03157203789370078740157483	100000.0-200000.0
	 ,0.000244140625			//13	96191.015786038877952755905511823	50000.0-100000.0
	 ,0.0001220703125			//14	48095.507893019438976377952755911	30000.0-50000.0
	 ,0.00006103515625			//15	24047.753946509719488188976377965	10000.0-30000.0
	 ,0.000030517578125			//16	12023.876973235260826771653543309	10000.0-30000.0
	 ,0.0000152587890625		//17	6011.9384866176304133858267716543	5000.0-10000.0
	 ,0.00000762939453125		//18	3005.9692433283726008858267716559	2000.0-4000
	 ,0.000003814697265625		//19	1502.9846216446081446850393700795
	 ,0.0000019073486328125		//20	751.49038700791207861712598425209
	 ,9.5367431640625e-7		//21	375.74519350395603930856299212605	
	 ,4.76837158203125e-7		//22	187.87259675197801965428149606303
 ];


/*********************************
 * 计算两个经纬度点之间距离
 * @author dingwanli
 *********************************/
function distanceByLnglat( _Longitude1, _Latidute1, _Longitude2, _Latidute2){
   var radLat1 = _Latidute1 * Math.PI / 180;
   var radLat2 = _Latidute2 * Math.PI / 180;
   var a = radLat1 - radLat2;
   var b = _Longitude1 * Math.PI / 180 - _Longitude2 * Math.PI / 180;
   var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
   s = s * 6378137.0;// 取WGS84标准参考椭球中的地球长半径(单位:m)
   //System.out.println(s);
   s = Math.round(s * 10000) / 10000;
   return s;
}


/**
 * 根据角度计算弧度
 * @param {Object} angel_d
 * @return {TypeName} 
 */
function rad(angel_d){
	return angel_d*Math.PI / 180.0 ;
}

/**
 * 根据弧度计算角度
 * @param {Object} x
 * @return {TypeName} 
 */
function deg(x) {
	return x*180/Math.PI;
}

/**
 * 大地主题解算(正算)代码：根据经纬度和方向角以及距离计算另外一点坐标
 * double startLon:起始点经度
 * double startLat:起始点纬度
 * double angel1:方位角,正北方向0度,顺时针为正方向,单位 度
 * double distance:距离,单位m
 * */
function computation( startLon, startLat, angel1, distance){
    /*
	'a      长轴半径
	'b      短轴
	'c      极曲率半径
	'alpha  扁率
	'e      第一偏心率
	'e2     第二偏心率
	'W      第一基本纬度函数
	'V      第二基本纬度函数
	'B1  点1的纬度
	'L1  点1的经度
	'B2  点2的纬度
	'L2  点2的经度
	** S 大地线长度
	'A1  点1到点2的方位角
	'A2  点2到点1的方位角
	*/
    var B1 = startLat ;
    var L1 = startLon ;
    var A1 = angel1 ;
    var S = distance ;
    var a = 6378245.0 ;
    var b = 6356752.3142 ;
    var c = Math.pow(a,2) / b ;
    
    var alpha = (a - b) / a ;
    var e = Math.sqrt( Math.pow(a,2)- Math.pow(b,2) ) / a ; 
    var e2 = Math.sqrt( Math.pow(a,2)- Math.pow(b,2) ) / b ; 
    
    B1 = rad(B1) ;
    L1 = rad(L1) ;
    A1 = rad(A1) ;
    
    var W = Math.sqrt( 1 - Math.pow(e,2)*Math.pow(Math.sin(B1),2) ) ;
    	
    var V = W * (a / b) ;
    var E1 = e ;//第一偏心率
    // 计算起点的归化纬度
    var W1 = W ; //''Sqr(1 - e1 * e1 * Sin(B1 ) * Sin(B1 ))
    var sinu1 = Math.sin(B1) * Math.sqrt(1 - E1 * E1) / W1 ;
    var cosu1 = Math.cos(B1) / W1 ;
    // 计算辅助函数值
    var sinA0 = cosu1 * Math.sin(A1) ; 
    var cotq1 = cosu1 * Math.cos(A1) ;
    var sin2q1 = 2 * cotq1 / ( Math.pow(cotq1,2) + 1 ) ;
    var cos2q1 = ( Math.pow(cotq1,2)-1) / ( Math.pow(cotq1,2) + 1) ;
    // 计算系数AA,BB,CC及AAlpha, BBeta的值
    var cos2A0 = 1 - Math.pow(sinA0,2) ;
    e2 = Math.sqrt( Math.pow(a,2) - Math.pow(b,2) ) / b ;
    var k2 = e2 * e2 * cos2A0 ;
    
    var aa = b * (1 + k2 / 4 - 3 * k2 * k2 / 64 + 5 * k2 * k2 * k2 / 256) ;
    var BB = b * (k2 / 8 - k2 * k2 / 32 + 15 * k2 * k2 * k2 / 1024) ;
    var CC = b * (k2 * k2 / 128 - 3 * k2 * k2 * k2 / 512) ;
    e2 = E1 * E1 ;
    var AAlpha = (e2 / 2 + e2 * e2 / 8 + e2 * e2 * e2 / 16) - (e2 * e2 / 16 + e2 * e2 * e2 / 16) * cos2A0 + (3 * e2 * e2 * e2 / 128) * cos2A0 * cos2A0 ;
    var BBeta = (e2 * e2 / 32 + e2 * e2 * e2 / 32) * cos2A0 - (e2 * e2 * e2 / 64) * cos2A0 * cos2A0 ;
    
    // 计算球面长度
    var q0 = (S - (BB + CC * cos2q1) * sin2q1) / aa ;
    var sin2q1q0 = sin2q1 * Math.cos(2 * q0) + cos2q1 * Math.sin(2 * q0) ;
    var cos2q1q0 = cos2q1 * Math.cos(2 * q0) - sin2q1 * Math.sin(2 * q0) ;
    var q = q0 + (BB + 5 * CC * cos2q1q0) * sin2q1q0 / aa ;
    // 计算经度差改正数
    var theta = (AAlpha * q + BBeta * (sin2q1q0 - sin2q1)) * sinA0 ;
    // 计算终点大地坐标及大地方位角
    var sinu2 = sinu1 * Math.cos(q) + cosu1 * Math.cos(A1) * Math.sin(q) ;
    var B2 = Math.atan( sinu2 / ( Math.sqrt(1 - E1 * E1) * Math.sqrt(1 - sinu2 * sinu2)) ) * 180 / Math.PI ;
    var lamuda = Math.atan( Math.sin(A1) * Math.sin(q) / (cosu1 * Math.cos(q) - sinu1 * Math.sin(q) * Math.cos(A1))) * 180 / Math.PI ;
                 
    if ( Math.sin(A1) > 0 ) {
        if ( Math.sin(A1) * Math.sin(q) / (cosu1 * Math.cos(q) - sinu1 * Math.sin(q) * Math.cos(A1)) > 0) 
        	lamuda = Math.abs(lamuda) ;
        else
        	lamuda = 180 - Math.abs(lamuda) ;
        }
    else{
    	if ( Math.sin(A1) * Math.sin(q) / (cosu1 * Math.cos(q) - sinu1 * Math.sin(q) * Math.cos(A1)) > 0) 
        	lamuda = Math.abs(lamuda) - 180 ;
        else
        	lamuda = -Math.abs(lamuda) ;
    }
            
    var L2 = L1 * 180 / Math.PI + lamuda - theta * 180 / Math.PI ;
 
	var A2 = Math.atan(cosu1 * Math.sin(A1) / (cosu1 * Math.cos(q) * Math.cos(A1) - sinu1 * Math.sin(q))) * 180 / Math.PI ;
    if ( Math.sin(A1) > 0) {
    	if (cosu1 * Math.sin(A1) / (cosu1 * Math.cos(q) * Math.cos(A1) - sinu1 * Math.sin(q)) > 0) 
        	A2 = 180 + Math.abs(A2) ;
        else
        	A2 = 360 - Math.abs(A2) ;
                
	}
    else{
    	if (cosu1 * Math.sin(A1) / (cosu1 * Math.cos(q) * Math.cos(A1) - sinu1 * Math.sin(q)) > 0) 
        	A2 = Math.abs(A2) ;
    	else
        	A2 = 180 - Math.abs(A2) ;
	}
                
    var result  = {x: L2,y:B2 } ;  
	return result ;
}
/**
 * 根据一组点求外接矩形坐标
 * @param {Object} points
 * @return {TypeName} 
 */
function getRectByPointsStr(pointsStr){
	var list=pointsStr.split(",");
	var points=new Array();
	for(i=0;i+1<list.length;i+=2){
		var point=new Object();
		point.x=parseFloat(list[i]);
		point.y=parseFloat(list[i+1]);
		points.push(point);
	}
	if(points!=null){
		if(points.length==1){
			return {"minx": points[0].x,"miny": points[0].y, "maxx" :points[0].x ,"maxy" :points[0].y};
		}else{
			var xmin=1000,ymin=1000,xmax=0,ymax=0;
			for(i=0;i<points.length;i++){
				if(points[i]!=null && points[i].x !=null && points[i].y!=null ){
					var x=points[i].x;
					var y=points[i].y;
					if(x<xmin){
						xmin=x;
					}
					if(x>xmax){
						xmax=x;
					}
					if(y<ymin){
						ymin=y;
					} 
					if(y>ymax){
						ymax=y;
					}
				}
			}
			return {"minx": xmin,"miny": ymin, "maxx" :xmax ,"maxy" :ymax};
		}
	}else {
		return null;
	}
}

/**
 * JS对象克隆
 * @param {Object} myObj
 * @return {TypeName} 
 */
function clone(myObj){   
	if(typeof(myObj) != 'object') return myObj;   
	if(myObj == null) return myObj;
	var myNewObj = new Object();   
	for(var i in myObj)   
	    myNewObj[i] = clone(myObj[i]);  
	return myNewObj;   
} 

/**
 * 简单JS数组拷贝
 * @param {Object} myArr
 * @return {TypeName} 
 */
function copyArray(myArr){  
	var newArr=new Array();
	if(Object.prototype.toString.call(myArr) === '[object Array]') {
		for(var i=0 ;i<myArr.length; i++){
			if(typeof(myArr[i]) == 'object'){
				newArr.push(clone(myArr[i]));
			}else{
				newArr.push(myArr[i]);
			}
		}
	}
	return newArr;
} 

/**
 * 地图叠加元素旋转
 * @param {Object} degree
 * @param {Object} iOverLay
 */
function rotateIOverLay(degree,iOverLay) {  
   if(window.navigator.userAgent.indexOf('MSIE') > -1){    
		//处理IE浏览器
	   var imageToRotate = iOverLay.div;
	   imageToRotate.style.filter= "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand')";  
	   var deg2radians = Math.PI * 2 / 360; 
	   var degreeToRotate =degree; // 旋转度数;  
	   var rad = degreeToRotate * deg2radians ;         
	   costheta = Math.cos(rad);          
	   sintheta = Math.sin(rad);  
	   imageToRotate.filters.item(0).M11 = costheta;          
	   imageToRotate.filters.item(0).M12 = -sintheta;         
	   imageToRotate.filters.item(0).M21 = sintheta;          
	   imageToRotate.filters.item(0).M22 = costheta;  
  }  
}


/**
 * 根据圆心和半径获取圆的边界点
 * @param {Object} point
 * @param {Object} radius
 * @return {TypeName} 
 */
function createCircleBorder(point,radius){
	var points=new Array();
	for(i=0;i<360;i+=5){
		var temp=computation(point.x,point.y,i,radius);
		var tempPoint=new  OpenLayers.Geometry.Point(temp.x,temp.y);
		points.push(tempPoint);
	}
	return points;
}

/**
 * 字符串数组转换成一个字符串，默认逗号
 * @param {Array} list 字符串数组
 * @return {String}
 */
function arrayToString(list,separator){
	if(list && list.length>0){
		var str=list[0];
		separator=separator?separator:",";
		for(var i=1;i<list.length;i++){
			str+=separator+list[i];
		}
		return str;
	}else{
		return "";
	}	
}

/**
 * 检测数组中是否已含有某个元素
 * @param {Object} list
 * @param {Object} item
 * @return {TypeName} 
 */
function isContainItem(list,item){
	for(var i=0;i<list.length;i++){
		if(item === list[i]){
			return true;
		}
	}
	return false;
}



/**
 * 坐标点字符串转换为点数组
 * @param {Object} pointsStr
 * @return {TypeName} 
 */
function pointsStrToPointArray(pointsStr){
	if(pointsStr!=null && pointsStr!=""){
		var  list = pointsStr.split(",");
		var pointList =new Array();
		for(var i=0;i+1<list.length;i+=2){
			var point=new OpenLayers.Geometry.Point(list[i], list[i+1]);
			pointList.push(point);
		}
		return pointList;
	}	
}

/**
 * 点数组转换为坐标点字符串
 * @param {Object} pointList
 * @param {Object} isPolygon 是否为多变型，若为多边形需首位坐标要一致
 * @return {TypeName} 
 */
function pointArrayToPointsStr(pointList,isPolygon){
	if(pointList!=null && pointList.length>0){
		var str=pointList[0].x+","+pointList[0].y;
		for(var i=1;i<pointList.length;i++){
			str+=","+pointList[i].x+","+pointList[i].y;
		}
		//若为多变型，首位相连
		if(isPolygon){
			str+=","+pointList[0].x+","+pointList[0].y;
		}
		return str;
	}	
}

/**
 * 创建线段等分点
 * @param {OpenLayers.Geometry.Point} p1 线段起点
 * @param {OpenLayers.Geometry.Point} p2 线段终点
 * @param {Number} n 等分数量
 * @return {Array<OpenLayers.Geometry.Point>}  list 返回等分点数组
 */
function createEquants(p1,p2,n){
	var list=new Array();
	//if(p1.x != p2.x && p1.y != p2.y ){
	var point, r1, r2, x, y;
	for(var i=1;i<n;i++){
		r1=i;
		r2=n-i;
		x=(r2*p1.x+r1*p2.x)/n;
		y=(r2*p1.y+r1*p2.y)/n;
		point=new OpenLayers.Geometry.Point(x,y);
		list.push(point);
	}
	//}
	return list;
}



/****************************************
     * 根据三角型的顶点坐标求顶点B的余弦
     * @param 丁万里
     * @return
     *******************************************/
	
function  getCosB(a,b,c){
	var cosb=0;
	var ab=Math.sqrt(Math.pow(a.x-b.x, 2)+Math.pow(a.y-b.y, 2));
	var bc=Math.sqrt(Math.pow(b.x-c.x, 2)+Math.pow(b.y-c.y, 2));
	cosb=((a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y))/(ab*bc);		
	return cosb;
}


/**
 * 根据两点坐标计算与正北方向的偏移角度
 * @param {Object} p1
 * @param {Object} p2
 * @return {TypeName} 
 */
GisUtil.computeAngle= function(p1,p2){
	
	var yy = p2.y - p1.y;                         
	var xx = p2.x - p1.x;
	//过滤特殊数值
	if(xx == 0 && yy >=0 ){
		return 0;	
	}else if(xx == 0 && yy <0 ){
		return 180;	
	}if(yy == 0 && xx >0 ){
		return 90;	
	}else if(yy == 0 && xx <0 ){
		return 270;	
	}
	
	var aa = Math.atan(xx / yy) ;
	aa=deg(aa);
	//如是二三象限+180度
	if( yy < 0){
		aa = aa + 180;
	}
	//如是四象限+360度
	if( xx < 0 && yy > 0 ){
		aa = aa + 2 *180;
	} 
	return aa;
};


//var mapEpsg=4326;  //此为全局变量，需要在地图初始化时进行赋值
GisUtil.transform = function(source){
	//投影坐标转换成经纬度坐标
	if(source && mapEpsg !=4326 ){
		return source.transform(map.displayProjection, map.getProjectionObject());
	}
	return source;
};

GisUtil.atransform = function(source){
	//经纬度坐转换成标投影坐标
	if(mapEpsg !=4326){
		return source.transform(map.getProjectionObject(), map.displayProjection);
	}
	return source;
};

//经纬度转墨卡托
GisUtil.lonLat2Mercator =function(lonLat){
	var x = lonLat.x *20037508.34/180;
    var y = Math.log(Math.tan((90+lonLat.y)*Math.PI/360))/(Math.PI/180);
    y = y *20037508.34/180;
	return new OpenLayers.Geometry.Point(x,y);
};


//墨卡托转经纬度
GisUtil.mercator2LonLat= function (mercator){
    var x = mercator.x/20037508.34*180;
    var y = mercator.y/20037508.34*180;
    y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
    return new OpenLayers.Geometry.Point(x,y);
};

//墨卡托转经纬度
GisUtil.mercator2LonLat= function (mercator){
    var x = mercator.x/20037508.34*180;
    var y = mercator.y/20037508.34*180;
    y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
    return new OpenLayers.Geometry.Point(x,y);
};

/**
 * 得到两点距离
 * 
 * @param {}
 *            point1 点1
 * @param {}
 *            point2 点2
 */
GisUtil.getTwoPointDistance = function(point1, point2) {
	var x = point1[0] - point2[0];
	var y = point1[1] - point2[1];
	return Math.sqrt(x * x + y * y);
}

/**
 * 求点到一条线段的距离
 * @param {}
 *            point 点
 * @param {}
 *            linePoint1 线的坐标1
 * @param {}
 *            linePoint2 线的坐标2
 */
GisUtil.getPointToOneLineDistance = function(point, linePoint1, linePoint2) {
	var a = linePoint2[1] - linePoint1[1];
	var b = linePoint1[0] - linePoint2[0];
	var c = -(a * linePoint2[0] + b * linePoint2[1]);
	var distance = Math.abs(a * point[0] + b * point[1] + c) / Math.sqrt(a * a + b * b);
	distance = Math.min(distance, GisUtil.getTwoPointDistance(point, linePoint1));
	distance = Math.min(distance, GisUtil.getTwoPointDistance(point, linePoint2));
	return distance;
}

/**
 * 曲线抽稀坐标 第一点开始依次筛选，去除冗余点。即以第一点为起点，计算第二点至第一点和第三点连线的垂直距离，若此距离大于某阈值，则保留第二点，
 * 并将其作为新起点，计算第三点至第二点和第四点连线的距离；否则，去除第二点，计算第三点至第一点和第四点连线距离，依次类推，
 * 直至曲线上最后一点。其阈值一般取相应地物最大允许误差或更小。
 * 
 * @param paths
 *            点几何
 * @param distance
 *            抽稀因子 与当前视野有关 一般用屏幕的3到10个像素乘以地图当前分辨率得到
 * @return
 */
GisUtil.vacuate = function(paths, distance) {
	var _paths = [];
	var length = paths.length;
	for ( var i = 0; i < length; i++) {
		var path = paths[i];
		var _path = [];
		var size = path.length;
		var firstPointIndex = 0;// 第一个点索引
		var secondPointIndex = 1;// 第二个点索引
		var threePointIndex = 2; // 第三个点索引
		_path.push(path[firstPointIndex]);
		for (; threePointIndex < size; threePointIndex++) {
			var _distance = 0;
			secondPointIndex = threePointIndex - 1;
			var fpoint = path[firstPointIndex];// 第一个点
			var spoint = path[secondPointIndex];// 第二个点
			var tpoint = path[threePointIndex];// 第三那个点
			_distance = GisUtil.getTwoPointDistance(spoint, fpoint);
			if (_distance > distance) {
				firstPointIndex = secondPointIndex;
				_path.push(spoint);
			} else {
				// 第二个和第三个点相同直接跳过
				if (spoint[0] == tpoint[0] && spoint[1] == tpoint[1]) {
					continue;
					// 第一个点和第三个点相同时
				} else if (fpoint[0] != tpoint[0] || fpoint[1] != tpoint[1]) {
					_distance = GisUtil.getPointToOneLineDistance(spoint, fpoint, tpoint);
				}
				// 距离大于抽稀抽稀因子保留点，并把第一个点的索引设置为当前第二个点索引
				if (_distance > distance) {
					firstPointIndex = secondPointIndex;
					_path.push(spoint);
				}
			}

		}
		_path.push(path[size - 1]);
		_paths.push(_path);
	}
	return _paths;
};

/**
 * 得到直线方程地 相关参数 ax+by+c=0;
 * @param {}
 *            x1
 * @param {}
 *            y1
 * @param {}
 *            x2
 * @param {}
 *            y2
 * @return {}返回a\b\c值
 */
GisUtil.getLineParam = function(x1, y1, x2, y2) {
	// 垂直线
	if (x1 == x2) {
		return {a : 1,b : 0,	c : -x1}
		// 平行线
	} else if (y1 == y2) {
		return {a : 0,b : 1,c : -y2	}
		// 一般线
	} else {
		// 直线方程ax-y+c=0;
		var a = (y2 - y1) / (x2 - x1);
		var c = y1 - a * x1;
		return {a : a,b : -1,c : c
		}
	}
};

/**
 * 得到点与一条直线的位置关系。
 * @param {}
 *            abc
 * @param {}
 *            x
 * @param {}
 *            y
 * @return 点在右边返回true 点在坐标返回false;
 */
GisUtil.getPointPosition = function(abc, x, y) {
	return (abc.a * x + abc.b * y + abc.c) >= 0 ? true : false;
};

/**
 * 判断一个环是否是自相交的
 * @param {}
 *            ring [[1,2],[3,4],[5,6],[1,2]]
 * @return boolean 自相交返回true 否则返回false
 */
GisUtil.intersectPolygon = function(ring) {
	var size = ring.length;
	// 小于等四个点肯定不相交
	if (size < 4) {
		return false;
	}
	for ( var i = 0; i < size - 1; i++) {
		// 第一边
		var abc = GisUtil.getLineParam(ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
		var temp;
		for ( var n = i + 2; n < size; n++) {
			var _temp = GisUtil.getPointPosition(abc, ring[n][0], ring[n][1]);
			;
			if (n == i + 2) {
				temp = _temp;
			} else {
				// 位置关系发生改变时
				if (temp != _temp) {
					var _abc = GisUtil.getLineParam(ring[n - 1][0], ring[n - 1][1], ring[n][0], ring[n][1]);
					// 肯定相交
					if (GisUtil.getPointPosition(_abc, ring[i][0], ring[i][1]) != GisUtil.getPointPosition(_abc, ring[i + 1][0], ring[i + 1][1])) {
						return true;
					} else {
						temp = _temp;
					}
				}
			}
		}

	}
	return false;
};

/*******************************************************************************
 * return: 0： 没有相交点 1： 有一个相交点 >1: 有多个相交点，会形成自交
 * 
 */
GisUtil.intersectLine = function(path) {
	var size = path.length;
	var intersectnum = 0;
	// 小于等四个点肯定不相交
	if (size < 4) {
		return 0;
	}
	for ( var i = 0; i < size - 2; i++) {
		// 第一边
		var abc = GisUtil.getLineParam(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
		var temp;
		for ( var n = i + 2; n < size; n++) {
			var _temp = GisUtil.getPointPosition(abc, path[n][0], path[n][1]);
			;
			if (n == i + 2) {
				temp = _temp;
			} else {
				// 位置关系发生改变时
				if (temp != _temp) {
					var _abc = GisUtil.getLineParam(path[n - 1][0], path[n - 1][1], path[n][0], path[n][1]);
					// 肯定相交
					if (GisUtil.getPointPosition(_abc, path[i][0], path[i][1]) != GisUtil.getPointPosition(_abc, path[i + 1][0], path[i + 1][1])) {
						intersectnum++;
					} else {
						temp = _temp;
					}
				}
			}
		}
	}
	return intersectnum;
};
