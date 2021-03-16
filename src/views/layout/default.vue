<template>
	<div class="home">
		<a-layout>
			<!-- <a-layout-sider :collapsed="true" :collapsed-width="48" collapsible :trigger="null">
				<div class="logo">
					<a-icon :component="LogoSvg" />
				</div>
				<a-menu mode="inline" theme="dark" :inline-collapsed="true" :inline-indent="16">
					<a-sub-menu key="sub1">
						<span slot="title">
							<a-icon type="cloud-server" />
							<span>资源管理</span>
						</span>
						<a-menu-item key="1" @click="$router.push('/asset')">资产列表</a-menu-item>
						<a-menu-item key="2">授权凭证</a-menu-item>
					</a-sub-menu>
					<a-menu-item key="3">
						<a-icon type="code" />
						<span>动态指令</span>
					</a-menu-item>
				</a-menu>
			</a-layout-sider>-->
			<a-layout>
				<a-layout-header>
					<a-tabs
						ref="tabs"
						v-model="activeRoute"
						hide-add
						size="small"
						type="editable-card"
						:tabBarGutter="0"
						@change="(route) => {$router.push(route)}"
						@edit="onEdit"
						@dblclick="showContextMenu"
						@contextmenu="showContextMenu"
					>
						<a-tab-pane
							v-for="route in visitedRoutes"
							:key="route.fullPath"
							:tab="route.title"
							:closable="true"
						></a-tab-pane>
					</a-tabs>
				</a-layout-header>
				<a-layout-content>
					<keep-alive>
						<router-view :key="$route.fullPath"></router-view>
					</keep-alive>
				</a-layout-content>
				<!-- <a-layout-footer></a-layout-footer> -->
			</a-layout>
		</a-layout>
		<a-menu class="ant-menu-contextmenu" mode="vertical" v-if="menuVisible" :style="menuStyle">
			<template v-if="!sshLoading">
				<template v-for="ssh in sshList">
					<a-menu-item :key="ssh.id" @click="goSSH(ssh)">{{ssh.name}}</a-menu-item>
				</template>
				<a-divider style="margin: 4px 0;" />
				<a-menu-item @click="goAdd">添加</a-menu-item>
			</template>
			<a-spin :spinning="sshLoading"></a-spin>
		</a-menu>
	</div>
</template>

<script>
import LogoSvg from "@/assets/logo.svg"
import { mapState } from "vuex"

export default {
	name: "Default",
	components: {},
	data() {
		return {
			LogoSvg,
			menuVisible: false,
			menuStyle: {
				position: "fixed",
				top: "0",
				left: "0",
				border: "1px solid #eee",
				zIndex: 999,
			},
			sshList: [],
			sshLoading: false,
		}
	},
	watch: {
		$route: {
			handler(route) {
				this.$store.dispatch("tabRoute/addVisitedRoute", route)
				this.activeRoute = route.fullPath
			},
			immediate: true,
		},
	},
	computed: {
		...mapState({
			visitedRoutes: (state) => state.tabRoute.visitedRoutes,
		}),
		exclude() {
			if (process.env.NODE_ENV === "production") {
				return ""
			}
			return /.+/
		},
	},
	methods: {
		onEdit(targetKey, action) {
			this[action](targetKey)
		},
		remove(fullPath) {
			this.$store.dispatch("tabRoute/deleteVisitedRoute", fullPath).then(() => {
				// 删除当前
				if (this.activeRoute == fullPath) {
					this.$router.push(this.visitedRoutes.length ? this.visitedRoutes[this.visitedRoutes.length - 1] : "/")
				}
			})
		},
		showContextMenu(e) {
			e.preventDefault()
			if (this.$refs.tabs.$el.querySelector(".ant-tabs-nav-scroll") !== e.target) {
				return false
			}
			this.getSSH()
			this.menuVisible = true
			this.menuStyle.top = e.clientY + "px"
			this.menuStyle.left = e.clientX + "px"
			document.body.addEventListener("click", this.bodyClick)
		},
		getSSH() {
			this.sshLoading = true
			this.$http
				.get("/assets/paging?pageIndex=1&pageSize=20&protocol=ssh&tags=")
				.then((res) => {
					this.sshList = res.data.items
				})
				.finally(() => {
					this.sshLoading = false
				})
		},
		bodyClick() {
			this.menuVisible = false
			document.body.removeEventListener("click", this.bodyClick)
		},
		goSSH(ssh) {
			this.$router.push({
				name: "ssh",
				params: {
					id: ssh.id,
				},
				query: {
					time: new Date().getTime(),
					name: ssh.name
				},
			})
		},
		goAdd() {
			window.open(window.localStorage.getItem("apiUrl") + "/#/asset")
		},
	},
	beforeRouteLeave(to, from, next) {
		console.log(this)
		next()
	},
}
</script>


<style lang="scss" scoped>
.logo {
	text-align: center;
	padding: 8px 0;
	.anticon {
		color: rgba(255, 255, 255, 0.4);
		font-size: 24px;
		transform: rotate(90deg);
	}
}
.ant-layout-sider {
	background: $--background-color-base;
	overflow: auto;
	height: 100vh;
	position: fixed;
	left: 0;
}
.ant-layout-header {
	background: $--background-color-base;
	overflow: auto;
	height: 35px;
	position: fixed;
	top: 0;
	left: 0;
	padding: 0;
	right: 0;
	z-index: 1;
	line-height: 1;
}
.ant-menu-inline-collapsed {
	width: 48px;
	background: $--background-color-base;
	.anticon {
		font-size: 24px;
		color: rgba(255, 255, 255, 0.4);
	}
	.ant-menu-item {
		padding: 0 12px !important;
	}
	::v-deep .ant-menu-submenu-title {
		padding: 0 12px !important;

		.anticon {
			font-size: 24px;
			color: rgba(255, 255, 255, 0.4);
		}
	}
}
.ant-tabs {
	::v-deep &-bar {
		margin: 0;
		border-bottom: 0;
		.ant-tabs-extra-content {
			line-height: 35px;
		}
		.ant-tabs-nav-container {
			height: 35px !important;
		}
	}
	::v-deep &-card &-card-bar &-tab {
		height: 34px;
		border-radius: 0;
		border: 0;
		border-right: 1px solid rgb(37, 37, 38);
		background-color: $--background-color-base;
		color: rgba(255, 255, 255, 0.5);
		line-height: 34px;
		.anticon {
			visibility: hidden;
		}
		&:hover {
			.anticon {
				color: rgb(255, 255, 255);
				visibility: unset;
			}
		}
		&-active {
			background-color: $--background-color-ssh;
			color: rgb(255, 255, 255);
			.anticon {
				color: rgb(255, 255, 255);
				visibility: unset;
			}
		}
	}
}
.ant-layout-content {
	padding-top: 35px;
	height: 100vh;
	box-sizing: border-box;
}
</style>
