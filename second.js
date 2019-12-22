var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk;
var myCharts = require("../../utils/wxcharts.js")//引入一个绘图的插件

const devicesId = "替换为你的设备ID" // 填写在OneNet上获得的devicesId 形式就是一串数字 例子:9939133
const api_key = "replace with your api-key" // 填写在OneNet上的 api-key 例子: VeFI0HZ44Qn5dZO14AuLbWSlSlI=


Page({
  data: {
    imgUrls:[
      { imgsrc: '../../images/pic1.jpg' },
      { imgsrc: '../../images/pic2.jpg' },
      { imgsrc: '../../images/pic3.jpeg' },
      { imgsrc: '../../images/pic4.jpg' },
      { imgsrc: '../../images/pic5.jpg' }
    ],
    province: '', //省
    city: '',  //市
    latitude: '',
    longitude: ''
  },
  onLoad: function () {
    qqmapsdk = new QQMapWX({
      //腾讯位置服务：   https://lbs.qq.com/console/mykey.html
      key: '3KTBZ-QOPWU-KROV4-455ZP-PIEPF-3UFKT' //这里自己的key秘钥进行填充，该key是腾讯位置服务中申请的
    });

    var that = this

    wx.getSetting({  //获取用户授权设置
      success: res => {

        console.log(JSON.stringify(res))

        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (dataAu) {
                    if (dataAu.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      that.getLocation();
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //调用wx.getLocation的API
          that.getLocation();
        }
        else {
          //调用wx.getLocation的API
          that.getLocation();
        }
      }
    })
  },
  // 微信获得经纬度
  getLocation: function () {
    let that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        console.log("success " + JSON.stringify(res))
        var latitude = res.latitude  //纬度，范围为 -90~90，负数表示南纬
        var longitude = res.longitude  //经度，范围为 -180~180，负数表示西经
        var speed = res.speed
        var accuracy = res.accuracy;
        console.log("latitude " + latitude + " ;longitude " + longitude)//这里获取的是经纬度
        that.getLocal(latitude, longitude) //把经纬度传给getLocal方法
      },
      fail: function (res) {
        console.log('fail ' + JSON.stringify(res))
      }
    })
  },
  // 获取当前地理位置
  getLocal: function (latitude, longitude) { //把经纬度转换成地理位置
    let that = this;
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (res) {
        console.log(JSON.stringify(res));
        let province = res.result.ad_info.province
        let city = res.result.ad_info.city
        that.setData({ //把地理位置省市赋值给声明在data中的变量
          province: province,
          city: city,
          latitude: latitude,
          longitude: longitude
        })

      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
        // console.log(res);
      }
    });
  },
  /**
   * @description 页面下拉刷新事件
   */
  onPullDownRefresh: function () {
    wx.showLoading({
      title: "正在获取"
    })
    this.getDatapoints().then(datapoints => {
      this.update(datapoints)
      wx.hideLoading()
    }).catch((error) => {
      wx.hideLoading()
      console.error(error)
    })
  },

  /**
   * @description 页面加载生命周期
   */
  onLoad: function () {
    console.log(`your deviceId: ${devicesId}, apiKey: ${api_key}`)

    //每隔6s自动获取一次数据进行更新
    const timer = setInterval(() => {
      this.getDatapoints().then(datapoints => {
        this.update(datapoints)
      })
    }, 6000)

    wx.showLoading({
      title: '加载中'
    })

    this.getDatapoints().then((datapoints) => {
      wx.hideLoading()
      this.firstDraw(datapoints)
    }).catch((err) => {
      wx.hideLoading()
      console.error(err)
      clearInterval(timer) //首次渲染发生错误时禁止自动刷新
    })
  },

  /**
   * 向OneNet请求当前设备的数据点
   * @returns Promise
   */
  getDatapoints: function () {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.heclouds.com/devices/${devicesId}/datapoints?datastream_id=Light,Temperature,Humidity&limit=20`,
        /**
         * 添加HTTP报文的请求头, 
         * 其中api-key为OneNet的api文档要求我们添加的鉴权秘钥
         * Content-Type的作用是标识请求体的格式, 从api文档中我们读到请求体是json格式的
         * 故content-type属性应设置为application/json
         */
        header: {
          'content-type': 'application/json',
          'api-key': api_key
        },
        success: (res) => {
          const status = res.statusCode
          const response = res.data
          if (status !== 200) { // 返回状态码不为200时将Promise置为reject状态
            reject(res.data)
            return;
          }
          if (response.errno !== 0) { //errno不为零说明可能参数有误, 将Promise置为reject
            reject(response.error)
            return;
          }

          if (response.data.datastreams.length === 0) {
            reject("当前设备无数据, 请先运行硬件实验")
          }

          //程序可以运行到这里说明请求成功, 将Promise置为resolve状态
          resolve({
            temperature: response.data.datastreams[0].datapoints.reverse(),
            light: response.data.datastreams[1].datapoints.reverse(),
            humidity: response.data.datastreams[2].datapoints.reverse()
          })
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * @param {Object[]} datapoints 从OneNet云平台上获取到的数据点
   * 传入获取到的数据点, 函数自动更新图标
   */
  update: function (datapoints) {
    const wheatherData = this.convert(datapoints);

    this.lineChart_hum.updateData({
      categories: wheatherData.categories,
      series: [{
        name: 'humidity',
        data: wheatherData.humidity,
        format: (val, name) => val.toFixed(2)
      }],
    })

    this.lineChart_light.updateData({
      categories: wheatherData.categories,
      series: [{
        name: 'light',
        data: wheatherData.light,
        format: (val, name) => val.toFixed(2)
      }],
    })

    this.lineChart_tempe.updateData({
      categories: wheatherData.categories,
      series: [{
        name: 'tempe',
        data: wheatherData.tempe,
        format: (val, name) => val.toFixed(2)
      }],
    })

  },

  /**
   * 
   * @param {Object[]} datapoints 从OneNet云平台上获取到的数据点
   * 传入数据点, 返回使用于图表的数据格式
   */
  convert: function (datapoints) {
    var categories = [];
    var humidity = [];
    var light = [];
    var tempe = [];

    var length = datapoints.humidity.length
    for (var i = 0; i < length; i++) {
      categories.push(datapoints.humidity[i].at.slice(5, 19));
      humidity.push(datapoints.humidity[i].value);
      light.push(datapoints.light[i].value);
      tempe.push(datapoints.temperature[i].value);
    }
    return {
      categories: categories,
      humidity: humidity,
      light: light,
      tempe: tempe
    }
  },

  /**
   * 
   * @param {Object[]} datapoints 从OneNet云平台上获取到的数据点
   * 传入数据点, 函数将进行图表的初始化渲染
   */
  firstDraw: function (datapoints) {

    //得到屏幕宽度
    var windowWidth = 320;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }

    var wheatherData = this.convert(datapoints);

    //新建湿度图表
    this.lineChart_hum = new myCharts({
      canvasId: 'humidity',
      type: 'line',
      categories: wheatherData.categories,
      animation: false,
      background: '#f5f5f5',
      series: [{
        name: 'humidity',
        data: wheatherData.humidity,
        format: function (val, name) {
          return val.toFixed(2);
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: 'humidity (%)',
        format: function (val) {
          return val.toFixed(2);
        }
      },
      width: windowWidth,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      extra: {
        lineStyle: 'curve'
      }
    });
    // 新建光照强度图表
    this.lineChart_light = new myCharts({
      canvasId: 'light',
      type: 'line',
      categories: wheatherData.categories,
      animation: false,
      background: '#f5f5f5',
      series: [{
        name: 'light',
        data: wheatherData.light,
        format: function (val, name) {
          return val.toFixed(2);
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: 'light (lux)',
        format: function (val) {
          return val.toFixed(2);
        }
      },
      width: windowWidth,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      extra: {
        lineStyle: 'curve'
      }
    });

    //新建温度图表
    this.lineChart_tempe = new myCharts({
      canvasId: 'tempe',
      type: 'line',
      categories: wheatherData.categories,
      animation: false,
      background: '#f5f5f5',
      series: [{
        name: 'temperature',
        data: wheatherData.tempe,
        format: function (val, name) {
          return val.toFixed(2);
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: 'temperature (摄氏度)',
        format: function (val) {
          return val.toFixed(2);
        }
      },
      width: windowWidth,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      extra: {
        lineStyle: 'curve'
      }
    });
  },

})