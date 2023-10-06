// ==UserScript==
// @name        【K胖解析】———百度云高速解析
// @namespace   http://tampermonkey.net/
// @version     1.0
// @description 一个能够获取百度云网盘文件高速下载链接的脚本,免费白嫖,灵感来源于@94list。可以当作是另一个分支,由我个人进行维护和开发后部分功能,学习PHP和JavaScript。并不专业可能存在BUG。
// @author      K胖
// @match       https://pan.baidu.com/*
// @icon        https://wsppt.top/resource/logo.png
// @grant       GM_xmlhttpRequest
// @require     https://cdn.jsdelivr.net/npm/sweetalert2@11
// ==/UserScript==

(function () {
    'use strict';

    var UA;
    var version = 1.0;
    var password;
    var bdwp_download = '0';
    var requestTimeout = 20000;
    var requestAPITimeout = 60000;
    var timeoutId = setTimeout(function () {
        Swal.fire({
            title: '系统提示',
            text: '初始化脚本失败，可能后台无法通讯，也有可能正在被攻击。建议查看公告或者群消息获取最新信息。',
            icon: 'error'
        });
    }, requestTimeout);

    GM_xmlhttpRequest({
        method: "post",
        url: 'https://info.cclocal.top',
        data: "type=get_sys_info",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (response) {
            clearTimeout(timeoutId);
            if (response.status == 200) {
                const get_sys_info = JSON.parse(response.responseText);
                UA = get_sys_info['UA'];
                password = get_sys_info['password'];
                if (get_sys_info['statusCode'] == 1) {
                    Swal.fire({
                        title: '系统公告',
                        text: get_sys_info['message'],
                        icon: 'info'
                    });
                }
            }

        }
    });

    function copyToBoard(text) {
        var temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.focus();
        temp.setSelectionRange(0, temp.value.length);
        document.execCommand("copy");
        document.body.removeChild(temp);
    }


    $('.wp-s-agile-tool-bar__header')
        .prepend('<button id="bdwp_download" class="u-button nd-file-list-toolbar-action-item u-button--primary" style="margin-right: 10px;background-color: #F03A17;border-color: #F03A17;"><i class="iconfont icon-download"></i> K胖解析</button>');

    $("#bdwp_download").click(function () {
        download_function();
    });


    function download_function() {
        var htmlString = $("html").html();
        var regex = /"bdstoken":"(\w+)"/;
        var match = regex.exec(htmlString);
        var bdstoken = match[1];
        var selectedIds = [];
        var downlist = [];
        $('tr.selected').each(function () {
            var dataId = $(this).data('id');
            selectedIds.push(dataId);
        });
        $('.mouse-choose-box .is-checked')
		.each(function() {
		let dataId = $(this)
		.data('id');
		if (dataId) {
		selectedIds.push(dataId);
		}
		});
        if (selectedIds.length === 0) {
            Swal.fire({
                title: '系统提示',
                text: '请选择需要下载的文件,目前暂不支持文件夹解析,因为还没学会.',
                icon: 'error'
            });
            return;
        }

        Swal.fire({
            title: '解析中心',
            html: '当前设置UA：<span style="color: #fa5555;">' + UA + '</span></br>当你看到这个页面的时候说明正在努力向后台请求,请耐心等待.</br>默认超时时间为60m,超过会自动弹窗别动!!!!',
            showCancelButton: false,
            showCloseButton: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            onBeforeOpen: () => {
                Swal.showLoading();
            }
        });

        $.post("https://pan.baidu.com/share/set?channel=chunlei&bdstoken=" + bdstoken + "", "period=1&pwd=" + password + "&eflag_disable=true&channel_list=%5B%5D&schannel=4&fid_list=[" + selectedIds + "]", function (res) {
            if (res.show_msg == "该文件禁止分享") {
                Swal.fire("错误！", "所选择的文件中包含违规文件，不能进行下载", "error");
                return;
            }
            var url = res.link;
            var shorturl = url.substring(url.lastIndexOf('/') + 1);
            $.post("https://pan.baidu.com/share/wxlist?channel=weixin&version=2.2.2&clienttype=25&web=1&qq-pf-to=pcqq.c2c", "shorturl=" + shorturl + "&dir=&root=1&pwd=qric&page=1&num=1000&order=time", function (rescon) {
                var dir = rescon.data.list;
                for (var i = 0; i < dir.length; i++) {
                    if (rescon.data.list[i].isdir == '1') {
                        Swal.fire({
                            title: '系统提示',
                            text: '暂不支持文件夹解析,该分享下有文件夹存在,请重新选择需要下载的文件.',
                            icon: 'error'
                        });
                        return;
                    }
                }
                var uk = rescon.data.uk;
                var shareid = rescon.data.shareid;
                var randsk = rescon.data.seckey;
                $.get("https://pan.baidu.com/share/tplconfig?shareid=" + shareid + "&uk=" + uk + "&fields=sign,timestamp&channel=chunlei&web=1&app_id=250528&clienttype=0", function (res) {
                    var timestamp = res.data.timestamp;
                    var sign = res.data.sign;

                    var requestAPI = setTimeout(function () {
                        Swal.fire({
                            title: '系统提示',
                            text: '获取高速链接失败！可能后台无法通讯，也有可能正在被攻击。建议查看公告或者群消息获取最新信息。'+res.data.message,
                            icon: 'error'
                        });
                    }, requestAPITimeout);

                    for (var i = 0; i < rescon.data.list.length; i++) {
                        GM_xmlhttpRequest({
                            method: "post",
                            url: 'https://bdwp.cclocal.top',
                            data: "fs_id=" + rescon.data.list[i].fs_id + "&sign=" + sign + "&time=" + timestamp + "&uk=" + uk + "&randsk=" + randsk + "&share_id=" + shareid + "",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            onload: function (response) {
                                clearTimeout(requestAPI);
                                const file = JSON.parse(response.responseText);
                                if (file.success === false) {
                                   
                                    Swal.fire("获取下载链接失败！", file.message, "error");
                                } else {
                                    Swal.fire({
                                        title: '成功获取链接，请选择加下来的操作！',
                                        showDenyButton: true,
                                        showCancelButton: true,
                                        confirmButtonText: '复制链接',
                                        denyButtonText: `发送到下载器`,
                                        showCloseButton: true,
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            const el = document.createElement('textarea');
                                            el.value = file.data.dlink;
                                            document.body.appendChild(el);
                                            el.select();
                                            document.execCommand('copy');
                                            document.body.removeChild(el);
                                            Swal.fire('复制成功！', '别忘记在下载其中设置的UA,今天的UA为:   ' + UA, 'success');
                                        } else if (result.isDenied) {

                                            Swal.fire({
                                                title: '发送到下载器',
                                                showDenyButton: true,
                                                showCancelButton: true,
                                                confirmButtonText: '发送到Motrix',
                                                denyButtonText: `发送Aria2`,
                                                showCloseButton: true,
                                            }).then((result) => {
                                                var url = file.data.dlink;
                                                if (result.isConfirmed) {
                                                    sendMotrix(url);
                                                } else if (result.isDenied) {
                                                    sendAria2(url);
                                                }
                                            })


                                        }
                                    })
                                }
                            }
                        });
                    }
                })
            })
            function sendAria2(url) {
                var jsonrpcData = {
                    jsonrpc: '2.0',
                    id: '1',
                    method: 'aria2.addUri',
                    params: [
                        [url],
                        {
                            "header": ["User-Agent: " + UA]
                        }
                    ]
                };

                $.ajax({
                    url: 'http://localhost:6800/jsonrpc',
                    type: 'POST',
                    data: JSON.stringify(jsonrpcData),
                    contentType: 'application/json',
                    success: function (response) {
                        Swal.fire('发送成功到Aria2', '请检查你的下载任务', 'success');
                    },
                    error: function (error) {
                        Swal.fire('发送错误！', '你可能没有安装或运行下载器!如果已经安装并运行,请尝试重启它,或者检查有没有开启RPC对应端口是否正确,默认Aria2端口为:6800', 'error');
                        return;
                    }
                });
            }
            function sendMotrix(url) {
                var jsonrpcData = {
                    jsonrpc: '2.0',
                    id: '1',
                    method: 'aria2.addUri',
                    params: [
                        [url],
                        {
                            "header": ["User-Agent: " + UA]
                        }
                    ]
                };

                $.ajax({
                    url: 'http://localhost:16800/jsonrpc',
                    type: 'POST',
                    data: JSON.stringify(jsonrpcData),
                    contentType: 'application/json',
                    success: function (response) {
                        Swal.fire('发送Motrix成功', '请检查你的下载任务', 'success');
                    },
                    error: function (error) {
                        Swal.fire('发送错误！', '你可能没有安装或运行下载器!如果已经安装并运行,请尝试重启它,或者检查有没有开启RPC对应端口是否正确,默认Motrix端口为:16800', 'error');
                        return;
                    }
                });
            }
        })
    }
})();