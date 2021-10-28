/*
  京东<热爱环游记>任务
  脚本执行时间过长，建议调低手机屏幕亮度，减少电量消耗和发热

  20211023 V1.1
  增加分身循环模式
  去除亮屏时长设置
  缩短浏览任务死循环时的等待时间
  调整返回逻辑
  调整部分任务文本，方便定位问题
  20211024 V1.2
  增加入会任务和入会参数（0：不执行入会任务 1：执行入会任务，遇到新入会店铺则退出脚本）
  增加小程序任务
  增加设备音量控制
  20211025 V1.3
  兼容京东金融任务，但由于入口不固定，故需要京东金融手动进入活动页面
  20211026 V1.4
  修复手动模式下京东金融APP无法识别，导致脚本自动退出的问题
  20211026 V1.5
  增加入会参数（0：不执行入会任务 1：执行入会任务，遇到新入会店铺则退出脚本 2：执行入会任务，遇到需入会店铺则返回，等待刷新别的店铺）
  20211026 V1.6
  修改任务退出方式，以便多账户情况下执行
  20211026 V1.6.1
  手动模式下，活动页面改为手动进入，避免个别手机进错活动页面
  20211026 V1.7
  修复入会参数为0时，遇到入会任务脚本直接退出或不停循环执行的问题
  20211026 V1.8
  增加任务列表打开判断，避免个别手机无法通过坐标点击打开任务列表
  20211026 V1.9
  支持手动模式下，直接检测活动界面
  20211026 V2.0
  增加页面状态参数，避免误点
*/
Start();
console.info("开始任务");

//浏览任务可能有直播或视频，提前静音
console.info("设备设置静音");
var v=device.getMusicVolume()
device.setMusicVolume(0)
sleep(1000);

//京东例子
Run("京东",2);home();
//京东金融例子
//Run("京东金融",0);home(); //京东金融活动入口：搜索<热爱环游记>即可进入活动页面
//手动例子
//Run("手动",2);home();
console.info("结束任务");

console.info("设备恢复原来音量");
device.setMusicVolume(v)
console.log("音量恢复为"+v);
sleep(1000);

console.log("已退出脚本");
engines.myEngine().forceStop()

function Start() {
    auto.waitFor();//获取无障碍服务权限
    console.show();//开启悬浮窗
    console.info("京东<热爱环游记>任务");
    //截图权限申请
    threads.start(function () {
        var beginBtn;
        if (beginBtn = classNameContains("Button").textContains("立即开始").findOne(2000)) {
            sleep(1000);
            beginBtn.click();
        }
    });
    sleep(1000);
    if (!requestScreenCapture(false)) {
        console.log("请求截图失败");
        exit();
    }
}

function Run(LauchAPPName,IsJoinMember) {
    setScreenMetrics(1440, 3120);//基于分辨率1440*3120的点击
    var PageStatus = 0//页面状态，用于记录当前页面状态，避免点击错位置
    if(IsJoinMember == null){
        IsJoinMember = 0 //0：不执行入会任务 1：执行入会任务，遇到新入会店铺则退出脚本
    }
    if(LauchAPPName == "手动"){
        console.info("请手动打开APP，以便进行下一步");
        while(text("领京豆").findOnce() == null){
            if(textMatches(/.*消耗.*汪汪币/).exists()|
                app.getAppName(currentPackage()) == "京东"|currentActivity() =="com.jingdong.app.mall.MainFrameActivity"
                |app.getAppName(currentPackage()) == "京东金融"|currentActivity() =="com.jd.jrapp.bm.mainbox.main.MainActivity"
                |currentActivity() =="com.jd.jrapp.bm.common.web.ui.WebActivity"){
                break;
            }
            console.log("当前应用名:  " + app.getAppName(currentPackage())+ "\n"
                +"当前活动:  " + currentActivity()+ "\n"
                +"未识别到京东相关界面，继续等待……");
            sleep(3000);
        }
        console.info("已检测到APP，等待下一步");
    }
    else{
        console.info("打开"+LauchAPPName+"");
        app.launchApp(LauchAPPName);
        console.log("等待活动检测……");
    }
    sleep(2000);
    if(!text("累计任务奖励").exists()){
        if(!textMatches(/.*消耗.*汪汪币/).exists()){
            //进入活动
            console.log("寻找活动入口……");
            if(LauchAPPName == "手动"|LauchAPPName.match(/京东金融/)|app.getAppName(currentPackage())=="京东金融"){
                for(;;){
                    if(textMatches(/.*消耗.*汪汪币/).exists()){
                        break;
                    }
                    toastLog("手动进入活动界面后，脚本将继续");
                    sleep(5000);
                }
            }
            else {
                const into = descContains("浮层活动").findOne(20000);
                sleep(2000);
                if (into == null) {
                    console.log("无法找到京东活动入口，退出当前任务");
                    return;
                }
                click(into.bounds().centerX(), into.bounds().centerY());
                click(into.bounds().centerX(), into.bounds().centerY());
            }
            console.info("进入活动页面");
        }
        else{
            console.log("检测到活动页面");
            PageStatus=1//进入活动页面，未打开任务列表
        }
    }
    else{
        console.log("检测到任务列表");
        PageStatus=2//已打开任务列表
    }
    if(PageStatus != 2){
        sleep(1000);
        console.log("成功进入活动界面");
        console.log("等待加载弹窗……");
        console.log("如有弹窗，请手动处理");
        sleep(3000);

        console.info("准备打开任务列表");
        let taskListButton = textMatches(/.*消耗.*汪汪币/).findOne(10000)
        if (!taskListButton) {
            console.log("未能识别任务列表，退出当前任务");
            return;
        }
        click(1250,2040);
        sleep(2000);

        for(var i = 0; !text("累计任务奖励").exists() && i < 10; i++){
            console.log("未识别到任务列表，请手动打开")
            sleep(3000);
        }
        if(i >= 10){
            console.log("未按时打开任务列表，退出当前任务");
            return;
        }
    }
    console.log("寻找未完成任务……");
    while (true) {
        let taskButtons = textMatches(/.*浏览并关注.*|.*浏览.*s.*|.*浏览.*秒.*|.*累计浏览.*|.*成功入会.*|.*浏览即可得.*|.*浏览可得.*|.*小程序.*/).find()
        if (taskButtons.empty()) {
            console.log("未找到合适的任务，退出");
            sleep(3000);
            break;
        }
        let taskButton, taskText
        let img = captureScreen()
        for (let i = 0; i < taskButtons.length; i++) {
            let item = taskButtons[i]
            taskText = item.text();
            item = item.parent().child(3);
            let b = item.bounds()
            let color = images.pixel(img, b.left+b.width()/10, b.top+b.height()/2)
            if (colors.isSimilar(color, "#fe2a60")) {
                //if (taskText.match(/成功入会/)) continue //如果有任务需要忽略可参考此格式
                if (taskText.match(/成功入会/) && IsJoinMember == 0) {
                    console.log("识别到入会任务，当前设置为<不执行入会>，即将进入下一任务");
                    sleep(1000);
                    continue;
                }
                taskButton = item;
                break;
            }
        }

        if (!taskButton) {
            console.log("未找到可自动完成的任务，退出当前任务");
            console.log("互动任务需要手动完成");
            sleep(2000);
            break;
        }

        function timeTask() {
            taskButton.click();
            sleep(1000);
            console.log("等待浏览任务完成……");
            let c = 0
            while (c < 15) { // 15秒，防止死循环
                let finish_reg = /获得.*?汪汪币|浏览完成|任务已达上限/
                if ((textMatches(finish_reg).exists() || descMatches(finish_reg).exists())){ // 等待已完成出现，有可能失败
                    break;
                }
                sleep(1000);
                c++;
                if (c == 3 |c == 6 |c == 12){
                    console.log("已等待"+c+"秒");
                }
            }
            if (c >= 15) {
                console.log("超时，即将返回");
            }
            else{
                console.log("浏览时长任务完成");
            }
        }

        function itemTask(cart) {
            taskButton.click();
            sleep(1000);
            console.log("等待进入商品列表……");
            textContains("当前页点击浏览").findOne(5000);
            let items = textContains(".jpg!q70").find()
            for (let i = 0; i < items.length; i++) {
                if (cart) {
                    console.log("加购并浏览");
                    items[i].parent().parent().child(5).click();
                } else {
                    console.log("浏览商品页");
                    items[i].parent().parent().child(4).click();
                }
                sleep(2000);
                console.log("返回");
                back();
                sleep(3000);
                if (i >= 4) {
                    break;
                }
            }
            console.log("浏览商品任务完成");
        }

        if (taskText.match(/浏览并关注|浏览即可得|浏览.*s|浏览.*秒/)) {
            console.log("进行", taskText);
            timeTask();
        } else if (taskText.match(/累计浏览/)) {
            console.log("进行累计浏览任务");
            if (taskText.match(/加购/)){
                itemTask(true);
            }
            else {
                itemTask(false);
            }
        } else if (taskText.match(/小程序/)) {
            console.log("进行小程序任务");
            taskButton.click();
            sleep(3000);
            while(id("ffp").exists() |text("取消").exists()){
                if(id("ffp").exists()){
                    id("ffp").findOne().click();
                    console.log("跳转微信异常，准备返回");
                    sleep(1000);
                }else if(text("取消").exists()){
                    text("取消").findOne().click();
                    console.log("取消");
                    sleep(1000);
                }
                sleep(1000);
            }
            back();
        } else if (taskText.match(/成功入会/)) {
            console.log("进行入会任务");
            taskButton.click();
            sleep(3000);
            if(textContains("确认授权并加入店铺会员").exists()){
                if(IsJoinMember == 2){
                    console.log("当前店铺未入会，跳过");
                }
                else if(IsJoinMember == 1){
                    console.log("涉及个人隐私，请手动加入店铺会员或者忽略加入会员任务");
                    break;
                }
            }
            else{
                console.info("已是当前店铺会员");
                console.log("任务完成");
            }
        } else if (taskText.match(/浏览可得/)) {
            console.log("进行浏览任务");
            taskButton.click();
            sleep(5000);
            if(text("互动种草城").exists()){
                if(textContains("/5)").exists()){
                    for(var i = 0; i < 5; i++){
                        console.log("第"+(i+1)+"次浏览店铺");
                        textContains("/5)").findOnce().parent().parent().child(2).click();
                        sleep(3000);
                        console.log("返回");
                        back();
                        sleep(1000);
                    }
                }
            }
            console.log("普通浏览任务完成");
        }

        for(var i = 0; !text("累计任务奖励").exists() && i < 5; i++){
            console.log("返回");
            back();
            sleep(1000);
            if(i==5){
                console.log("无法返回任务界面，退出当前任务");
                return;
            }
        }
        console.info("准备下一个任务");
    }
}
