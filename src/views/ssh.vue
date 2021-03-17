<template>
	<div class="page-ssh">
		<div class="action-box">
			<a-tooltip placement="bottom" v-if="sessionIdList.length > 1" title="删除ssh">
				<a-icon type="close-square" @click="deletePane" />
			</a-tooltip>
			<a-tooltip placement="bottom" title="添加ssh">
				<a-icon type="border-inner" @click="addPane" />
			</a-tooltip>
			<a-dropdown :trigger="['click']" @visibleChange="(visible) => {visible && getSSH()}">
				<a-tooltip placement="bottom" title="添加其他ssh" @click="e => e.preventDefault()">
					<a-icon type="border-outer" />
				</a-tooltip>
				<a-menu slot="overlay" class="ant-menu-contextmenu" mode="vertical">
					<template v-if="!sshLoading">
						<template v-for="ssh in sshList">
							<a-menu-item :key="ssh.id" v-if="ssh.id != assetId" @click="addSsh(ssh)">{{ssh.name}}</a-menu-item>
						</template>
					</template>
					<a-spin :spinning="sshLoading"></a-spin>
				</a-menu>
			</a-dropdown>
			<a-tooltip placement="bottom" title="切换ssh布局">
				<a-icon
					:type="sshHorizontal ? 'border-horizontal': 'border-verticle'"
					@click="sshHorizontal = !sshHorizontal"
				/>
			</a-tooltip>
			<a-tooltip placement="bottom" title="切换文件布局">
				<a-icon
					:type="isHorizontal ? 'border-horizontal': 'border-verticle'"
					@click="isHorizontal = !isHorizontal"
				/>
			</a-tooltip>
		</div>
		<splitpanes>
			<pane>
				<splitpanes :horizontal="isHorizontal">
					<pane>
						<splitpanes :horizontal="sshHorizontal" @pane-click="handleClickPane">
							<template v-for="(item, i) in sessionIdList">
								<pane style="padding: 5px;" :key="item.key">
									<xterm
										v-model="item.value"
										class="spin-xterm"
										:assetId="item.assetId || assetId"
										v-if="item.assetId || assetId"
									/>
									<div class="mask" v-if="i !== activePane"></div>
								</pane>
							</template>
						</splitpanes>
					</pane>
					<pane>
						<file
							class="spin-file"
							:sessionId="sessionIdList[activePane].value"
							v-if="sessionIdList[activePane] && sessionIdList[activePane].value"
						></file>
					</pane>
				</splitpanes>
			</pane>
			<template v-for="(item, key) in otherSsh">
				<pane :key="item.id + key">
					<splitpanes :horizontal="isHorizontal">
						<pane>
							<xterm v-model="item.value" class="spin-xterm" :assetId="item.id " v-if="item.id" />
						</pane>
						<pane>
							<file class="spin-file" :sessionId="item.value" v-if="item.value"></file>
						</pane>
					</splitpanes>

					<div class="other-ssh-header">
						<span data-v-35d61044 class="ant-tag">
							<span class="text-over">{{item.name}}</span>
							<a-icon class="anticon-close" type="close" @click="$delete(otherSsh, key)"></a-icon>
						</span>
					</div>
				</pane>
			</template>
		</splitpanes>
	</div>
</template>

<script>
import xterm from "@/components/xterm.vue"
import file from "@/components/file.vue"
import { Splitpanes, Pane } from "splitpanes"
import "splitpanes/dist/splitpanes.css"

export default {
	name: "ssh",
	components: {
		xterm,
		Splitpanes,
		Pane,
		file,
	},
	data() {
		return {
			sessionIdList: [{ key: new Date().getTime(), value: "", assetId: "" }],
			otherSsh: {},
			isHorizontal: true,
			sshHorizontal: false,
			activePane: 0,
			assetId: "",
			command: "",

			sshList: [],
			sshLoading: false,
		}
	},
	watch: {
		$route: {
			handler() {
				let visitedRoutes = this.$store.state.tabRoute.visitedRoutes
				let target = visitedRoutes.find((item) => item.fullPath == this.$vnode.key)
				if (!target) {
					this.$destroy()
				}
			},
			immediate: true,
		},
	},
	methods: {
		handleClickPane(e) {
			this.activePane = e.index
		},
		addPane() {
			this.sessionIdList.push({
				key: new Date().getTime(),
				value: "",
			})
			this.activePane = this.sessionIdList.length - 1
		},
		deletePane() {
			this.sessionIdList.splice(this.activePane, 1)
			this.activePane = 0
		},
		showMenu(e) {
			e.preventDefault()
			this.getSSH()
			this.menuVisible = true
			this.menuStyle.top = e.clientY + "px"
			this.menuStyle.left = e.clientX + "px"
			document.body.addEventListener("click", this.bodyClick)
		},
		addSsh(ssh) {
			this.$set(this.otherSsh, ssh.id + new Date().getTime(), { ...ssh, value: "" })
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
			// this.menuVisible = false
			document.body.removeEventListener("click", this.bodyClick)
		},
	},
	created() {
		this.assetId = this.$route.params.id
	},
	beforeRouteUpdate(to, from, next) {
		if (this.$route.params.id && this.$route.params.id != this.assetId) {
			this.assetId = this.$route.params.id
		}
		next()
	},
	activated() {
		console.log("a")
	},
	deactivated() {
		console.log("de")
	},
}
</script>


<style lang="scss" scoped>
.page-ssh {
	height: 100%;
}
.action-box {
	position: fixed;
	right: 10px;
	top: 8px;
	z-index: 10;
	.anticon {
		color: $--color-base;
		font-size: 16px;
		margin-left: 6px;
	}
}
.ant-spin-nested-loading {
	height: 100%;
	::v-deep > .ant-spin-container {
		height: 100%;
	}
}
.spin-xterm,
.spin-file {
	height: 100%;
}
.splitpanes {
	::v-deep & > .splitpanes__pane {
		position: relative;
		.mask {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			background: #333;
			opacity: 0.4;
		}
	}
	::v-deep &--vertical {
		& > .splitpanes {
			&__splitter {
				border-right: 1px solid $--border-color-base;
				border-top: 0;
				z-index: 999;
			}
			&__pane {
				background-color: $--background-color-ssh;
			}
		}
	}
	::v-deep &--horizontal {
		& > .splitpanes {
			&__splitter {
				border-right: 0;
				border-top: 1px solid $--border-color-base;
				z-index: 999;
			}
			&__pane {
				background-color: $--background-color-ssh;
			}
		}
	}
}
.other-ssh-header {
	position: absolute;
	top: 5px;
	left: 5px;
	z-index: 8;
	opacity: 0.6;
	.ant-tag {
		color: #fff;
		background: #3c3c3c;
		border: 1px solid #3c3c3c;
		.text-over {
			max-width: 200px;
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
			display: inline-block;
			vertical-align: middle;
		}
	}
	.anticon-close {
		color: #fff;
		&:hover {
			color: $--color-primary;
		}
	}
}
</style>
