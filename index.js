var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk;

// pages/first/first.js
var timestamp = Date.parse(new Date());
//返回当前时间毫秒数
timestamp = timestamp / 1000;
//获取当前时间
var n = timestamp *
  1000;
var date = new Date(n);
//年
var Y =
  date.getFullYear();
//月
var M = (date.getMonth()
  + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
//日
var D = date.getDate()
  < 10 ? '0' + date.getDate() :
  date.getDate();
//时
var h =
  date.getHours();
//分
var m =
  date.getMinutes();
//秒
var s =
  date.getSeconds();
  //  放在page外
Page({
  bindViewTap: function () {
   

    wx.navigateTo({
      url: '../second/second'
    })
  },

  data: {
  region:['北京市','北京市','东城区'],
  now:'',
  logs:'',
  province: '', //省
  city: '',  //市
  },
  onLoad: function () {
    this.getWeather();
    this.setData({
      logs: Y + "-" + M + "-" + D + "  " + h + ":" + m + ":" + s,
    });


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
        console.log(that.data.city)
        that.setData({ //把地理位置省市赋值给声明在data中的变量
          province: province,
          city: city,
          latitude: latitude,
          longitude: longitude
        });
        console.log(that.data.city)
        that.getWeather()
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
        // console.log(res);
      }
    });
  },
  change:function(e){
    console.log(e.detail)
  this.setData({ 
  region:e.detail.value
  });
  this.getWeather();
  
  },
  getWeather:function(){
   var that=this;//this不可以在wxAPI函数内部使用；
   console.log(that.data.city);
   wx.request({
     url: 'https://free-api.heweather.net/s6/weather/now?',
     data:{
       location:that.data.city,
       key:'3380b27199e5441796d511644db41ed9',
     },
     success:function(res){
      console.log(res.data);
      that.setData({
      now:res.data.HeWeather6[0].now,
      });
     }
   })

  },


  

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})