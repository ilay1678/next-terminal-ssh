(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-2d229481"],{dd7b:function(t,e,i){"use strict";i.r(e);var r=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{directives:[{name:"resize",rawName:"v-resize"}],ref:"xterm",staticClass:"xterm-box",staticStyle:{height:"100vh"},on:{keydown:t.handleKeydown,resize:t.onResize}})},s=[],o=(i("abb2"),i("fcf3")),n=i("47d0"),a={data:function(){return{step:"username",form:{username:"",password:"",totp:""},rules:{username:[{required:!0,message:"请输入登录账号！",trigger:"blur"}],password:[{required:!0,message:"请输入登录密码！",trigger:"blur"}],totp:[{required:!0,message:"请输入双因素认证APP中显示的授权码",trigger:"blur"}]},loginLoading:!1,totpModalVisible:!1,confirmLoading:!1,tempValue:"",term:null,fitAddon:null}},methods:{loginSuccess:function(t){localStorage.setItem("X-Auth-Token",t.data),this.$message.success("登陆成功"),this.$router.push("/")},prompt:function(t){t.write("\r\n$ ")},initXterm:function(){var t=this;window.localStorage.getItem("apiUrl")||(this.step="apiUrl"),this.$nextTick((function(){var e=new o["Terminal"]({fontFamily:'monaco, Consolas, "Lucida Console", monospace',fontSize:14,theme:{background:"rgb(40, 44, 52)"},rightClickSelectsWord:!0});t.fitAddon=new n["FitAddon"],e.loadAddon(t.fitAddon),e.open(t.$refs.xterm),t.fitAddon.fit(),e.focus(),e.prompt=function(){e.write("\r\n$ ")},e.writeln("欢迎进入Next Terminal ..."),e.writeln("神奇的功能等待你去发现 ..."),e.attachCustomKeyEventHandler((function(t){var e=/Mac|iPod|iPhone|iPad/.test(navigator.platform)?"meta":"ctrl";return!t[e+"Key"]||"l"!==t.key&&void 0})),t.prompt(e),e.write("apiUrl"==t.step?"请输入next-terminal后端地址":"请输入用户名"),t.prompt(e),e.onData((function(i){switch(i){case"\r":console.log(1),t.prompt(e),t.nextStep();break;case"":t.prompt(e),t.emptyValue();break;case"":e._core.buffer.x>2&&(e.write("\b \b"),t.delValue());break;default:if(t.loginLoading)return!1;t.writeValue(i),"password"==t.step?e.write("*"):e.write(i)}})),t.term=e}))},onResize:function(){this.fitAddon.fit()},handleKeydown:function(t){var e=/Mac|iPod|iPhone|iPad/.test(navigator.platform)?"meta":"ctrl";if(!t[e+"Key"])return!1;"l"==t.key&&(window.localStorage.setItem("apiUrl",""),this.form={username:"",password:"",totp:""},this.step="apiUrl",this.term.clear(),this.term.write("1.请输入next-terminal后端地址 （CTRL + L 清空全部输入）"),this.prompt(this.term),t.preventDefault())},nextStep:function(){var t=this;switch(this.step){case"apiUrl":this.tempValue?(window.localStorage.setItem("apiUrl",this.tempValue),this.term.write("2.请输入用户名（CTRL + L 清空全部输入）"),this.prompt(this.term),this.step="username"):(this.term.write("请输入next-terminal后端地址（CTRL + L 清空全部输入）"),this.prompt(this.term));break;case"username":this.tempValue?(this.form.username=this.tempValue,this.term.write("3.请输入密码（CTRL + L 清空全部输入）"),this.prompt(this.term),this.step="password"):(this.term.write("请确认输入用户名（CTRL + L 清空全部输入）"),this.prompt(this.term));break;case"password":this.tempValue?(this.form.password=this.tempValue,this.loginLoading=!0,this.$http.post("/login",this.form).then((function(e){if(0===e.code)return t.loginLoading=!1,t.step="totp",t.term.write("请输入双因素验证（CTRL + L 清空全部输入）"),t.prompt(t.term),!1;1===e.code&&t.loginSuccess(e)})).catch((function(){t.loginLoading=!1,t.term.write("4.请确认输入密码（CTRL + L 清空全部输入）"),t.prompt(t.term)}))):(this.term.write("请确认输入密码（CTRL + L 清空全部输入）"),this.prompt(this.term));break;case"totp":this.tempValue?(this.form.totp=this.tempValue,this.loginLoading=!0,this.$http.post("/loginWithTotp",this.form).then((function(e){1===e.code&&t.loginSuccess(e)})).catch((function(){t.loginLoading=!1,t.term.write("请确输入双因素验证（CTRL + L 清空全部输入）"),t.prompt(t.term)}))):(this.term.write("请确输入双因素验证（CTRL + L 清空全部输入）"),this.prompt(this.term))}this.tempValue=""},delValue:function(){this.tempValue=this.tempValue.substring(0,this.tempValue.length-1)},writeValue:function(t){this.tempValue+=t},emptyValue:function(){this.tempValue=""}},created:function(){this.initXterm()}},m=a,l=i("2877"),p=Object(l["a"])(m,r,s,!1,null,null,null);e["default"]=p.exports}}]);
//# sourceMappingURL=chunk-2d229481.3875baff.js.map