/**
 * 各地图API坐标系统比较与转换;
 * WGS84坐标系：即地球坐标系，国际上通用的坐标系。设备一般包含GPS芯片或者北斗芯片获取的经纬度为WGS84地理坐标系,
 * 谷歌地图采用的是WGS84地理坐标系（中国范围除外）;
 * GCJ02坐标系：即火星坐标系，是由中国国家测绘局制订的地理信息系统的坐标系统。由WGS84坐标系经加密后的坐标系。
 * 谷歌中国地图、高德地图和搜搜中国地图采用的是GCJ02地理坐标系; 
 * BD09坐标系：即百度坐标系，GCJ02坐标系经加密后的坐标系;
 * 搜狗坐标系、图吧坐标系等，估计也是在GCJ02基础上加密而成的。 
 */

var GPS = {	
	
	PI : 3.14159265358979324,
	x_pi : 3.14159265358979324 * 3000.0 / 180.0,
	
	delta : function(lat, lon) {
		var a = 6378245.0;
		var ee = 0.00669342162296594323;
		var dLat = this.transformLat(lon - 105.0, lat - 35.0);
		var dLon = this.transformLon(lon - 105.0, lat - 35.0);
		var radLat = lat / 180.0 * this.PI;
		var magic = Math.sin(radLat);
		magic = 1 - ee * magic * magic;
		var sqrtMagic = Math.sqrt(magic);
		dLat = (dLat * 180.0)/ ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI);
		dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI);
		return {
			'lat' : dLat,
			'lon' : dLon
		};
	},
	
	//WGS-84 to 火星坐标系 (GCJ-02) World Geodetic System ==> Mars Geodetic System
	wgs84ToGcj02 : function(wgsLat, wgsLon) {
		if (this.outOfChina(wgsLat, wgsLon))
			return {
				'lat' : wgsLat,
				'lon' : wgsLon
			};

		var d = this.delta(wgsLat, wgsLon);
		return {
			'lat' : wgsLat + d.lat,
			'lon' : wgsLon + d.lon
		};
	},
	
	//火星坐标系 (GCJ-02) to WGS-84 （精确版）
	gcj02ToWgs84 : function(gcjLat, gcjLon) {
		var initDelta = 0.01;
		var threshold = 0.000000001;
		var dLat = initDelta, dLon = initDelta;
		var mLat = gcjLat - dLat, mLon = gcjLon - dLon;
		var pLat = gcjLat + dLat, pLon = gcjLon + dLon;
		var wgsLat, wgsLon, i = 0;
		while (1) {
			wgsLat = (mLat + pLat) / 2;
			wgsLon = (mLon + pLon) / 2;
			var tmp = this.wgs84ToGcj02(wgsLat, wgsLon)
			dLat = tmp.lat - gcjLat;
			dLon = tmp.lon - gcjLon;
			if ((Math.abs(dLat) < threshold) && (Math.abs(dLon) < threshold))
				break;

			if (dLat > 0)
				pLat = wgsLat;
			else
				mLat = wgsLat;
			if (dLon > 0)
				pLon = wgsLon;
			else
				mLon = wgsLon;

			if (++i > 10000)
				break;
		}
		return {
			'lat' : wgsLat,
			'lon' : wgsLon
		};
	},
	
	//火星坐标系 (GCJ-02) to WGS-84 （简单实现）
	gcj02ToWgs84Simple : function(gcjLat, gcjLon) {
		if (this.outOfChina(gcjLat, gcjLon))
			return {
				'lat' : gcjLat,
				'lon' : gcjLon
			};

		var d = this.delta(gcjLat, gcjLon);
		return {
			'lat' : gcjLat - d.lat,
			'lon' : gcjLon - d.lon
		};
	},
	
	//火星坐标系 (GCJ-02)  to 百度坐标系(BD-09) 
	gcj02ToBd09 : function(gcjLat, gcjLon) {
		var x = gcjLon, y = gcjLat;
		var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
		var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
		var bdLon = z * Math.cos(theta) + 0.0065;
		var bdLat = z * Math.sin(theta) + 0.006;
		return {
			'lat' : bdLat,
			'lon' : bdLon
		};
	},
	//百度坐标系(BD-09) to 火星坐标系 (GCJ-02)
	bd09ToGcj02 : function(bdLat, bdLon) {
		var x = bdLon - 0.0065, y = bdLat - 0.006;
		var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
		var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
		var gcjLon = z * Math.cos(theta);
		var gcjLat = z * Math.sin(theta);
		return {
			'lat' : gcjLat,
			'lon' : gcjLon
		};
	},

	//WGS-84 to 百度坐标系 (BD-02) 
	wgs84ToBd02 : function(wgsLat, wgsLon) {
		var gcj=this.wgs84ToGcj02(wgsLat, wgsLon);
		return this.gcj02ToBd09(gcj.lat, gcj.lon);
	},
	
	
	//百度坐标系 (BD-02) to WGS-84
	bd02ToWgs84 : function(bdLat, bdLon) {
		var gcj=this.bd09ToGcj02(bdLat, bdLon);
		return this.gcj02ToWgs84(gcj.lat, gcj.lon);
	},
	
	
	distance : function(latA, logA, latB, logB) {
		var earthR = 6371000;
		var x = Math.cos(latA * Math.PI / 180) * Math.cos(latB * Math.PI / 180)
				* Math.cos((logA - logB) * Math.PI / 180);
		var y = Math.sin(latA * Math.PI / 180) * Math.sin(latB * Math.PI / 180);
		var s = x + y;
		if (s > 1)
			s = 1;
		if (s < -1)
			s = -1;
		var alpha = Math.acos(s);
		var distance = alpha * earthR;
		return distance;
	},
	outOfChina : function(lat, lon) {
		if (lon < 72.004 || lon > 137.8347)
			return true;
		if (lat < 0.8293 || lat > 55.8271)
			return true;
		return false;
	},
	transformLat : function(x, y) {
		var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2
				* Math.sqrt(Math.abs(x));
		ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x
				* this.PI)) * 2.0 / 3.0;
		ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0
				* this.PI)) * 2.0 / 3.0;
		ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y
				* this.PI / 30.0)) * 2.0 / 3.0;
		return ret;
	},
	transformLon : function(x, y) {
		var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1
				* Math.sqrt(Math.abs(x));
		ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x
				* this.PI)) * 2.0 / 3.0;
		ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0
				* this.PI)) * 2.0 / 3.0;
		ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x
				/ 30.0 * this.PI)) * 2.0 / 3.0;
		return ret;
	}
};