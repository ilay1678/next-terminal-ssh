<template>
	<a-config-provider :locale="zh_CN">
		<div id="app">
			<router-view />
		</div>
	</a-config-provider>
</template>

<script>
import zh_CN from "ant-design-vue/lib/locale-provider/zh_CN"
import moment from "moment"
import "moment/locale/zh-cn"
moment.locale("zh-cn")
export default {
	data() {
		return {
			zh_CN,
		}
	},
	created() {},
}
</script>

<style lang="scss">
body {
	margin: 0px;
	padding: 0px;
	overscroll-behavior-x: none;
	background: $--background-color-base;
}

/* 滚动条宽度 */
::-webkit-scrollbar {
	width: 3px;
	height: 10px;
}
/* 滚动条的滑块 */
::-webkit-scrollbar-thumb {
	background-color: #a1a3a9;
	border-radius: 3px;
}
</style>
