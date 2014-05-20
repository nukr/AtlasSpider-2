var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var couponSchema = new Schema({
    poi_id       : String,      // 先空白
    title        : String,      // 團購券標題
    desc         : String,      // 團購券內容
    start        : Date,        // 活動開始日期
    expire       : Date,        // 活動結束日期
    keywords     : String,      // 活動關鍵字或者是團購券類型 (如果有的話,若無則空白)
    last_updated : {type: Date, default: Date.now},        // 資料寫入更新時間
    web_url      : String,      // 團購券對映網站網址
    mobile_url   : String,      // 團購券手機版網站網址
    pic_url      : String,      // 團購券對應圖片 (如果有的話,若無則空白)
    active       : {type: Boolean, default: true},     // 是否為有效團購券(預設為true)
});

mongoose.model('Coupon', couponSchema);
