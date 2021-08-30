<template>
	<div class="xterm-box" @keydown="handleKeydown" v-resize @resize="onResize" ref="xterm">
		<div class="search-box" v-if="showSearch">
			<a-input
				v-model="keyword"
				@keydown.enter="search('next')"
				ref="keyword"
				@change="search('next')"
			>
				<template slot="suffix">
					<a-tooltip title="区分大小写">
						<a-icon
							:component="AaSvg"
							:class="{active: searchOptions.caseSensitive}"
							@click="searchOptions.caseSensitive = !searchOptions.caseSensitive"
						/>
					</a-tooltip>
					<a-tooltip title="全字匹配">
						<a-icon
							:component="WholeWordSvg"
							:class="{active: searchOptions.wholeWord}"
							@click="searchOptions.wholeWord = !searchOptions.wholeWord"
						/>
					</a-tooltip>
					<a-tooltip title="正则匹配">
						<a-icon
							:component="RegexSvg"
							:class="{active: searchOptions.regex}"
							@click="searchOptions.regex = !searchOptions.regex"
						/>
					</a-tooltip>
				</template>
			</a-input>
			<a-icon type="arrow-up" @click="search('pre')" />
			<a-icon type="arrow-down" @click="search('next')" />
			<a-icon type="close" @click="closeSearch" />
		</div>
		<a-form-model layout="inline" class="command-box">
			<a-form-model-item>
				<a-select
					style="width: 200px"
					show-search
					placeholder="快速输入"
					v-model="commandSelect"
					@focus="getCommandList"
					@select="setCommand('Select')"
					:loading="commandLoading"
				>
					<div slot="dropdownRender" slot-scope="menu">
						<v-nodes :vnodes="menu" />
						<a-divider style="margin: 4px 0;" />
						<div
							style="padding: 4px 8px; cursor: pointer;"
							@mousedown="e => e.preventDefault()"
							@click="addCommand"
						>
							<a-icon type="plus" />添加
						</div>
					</div>
					<template v-for="item in commandList">
						<a-select-option :key="item.id" :value="item.content">{{item.name}}</a-select-option>
					</template>
				</a-select>
			</a-form-model-item>
			<a-form-model-item>
				<a-input @keydown.enter="setCommand('Input')" v-model="commandInput" placeholder="批量输入"></a-input>
			</a-form-model-item>
			<a-form-model-item>
				<a-tooltip title="在所有终端运行">
					<a-switch v-model="commandAll"></a-switch>
				</a-tooltip>
			</a-form-model-item>
		</a-form-model>
	</div>
</template>

<script>
import "xterm/css/xterm.css"
import { Terminal } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { SearchAddon } from "xterm-addon-search"
import AaSvg from "@/assets/svg/Aa.svg"
import RegexSvg from "@/assets/svg/Regex.svg"
import WholeWordSvg from "@/assets/svg/WholeWord.svg"
import { mapState } from "vuex"

export default {
	props: {
		assetId: String,
		value: String,
	},
	components: {
		VNodes: {
			functional: true,
			render: (h, ctx) => ctx.props.vnodes,
		},
	},
	data() {
		return {
			AaSvg,
			RegexSvg,
			WholeWordSvg,
			socket: null,
			term: null,
			fitAddon: null,
			searchAddon: null,
			pingInterval: null,
			resizeT: null,
			sessionIdLoading: false,
			sessionId: "",
			keyword: "",
			showSearch: false,
			searchOptions: {
				regex: false, // 正则
				caseSensitive: false, // 区分大小写
				wholeWord: false, // 全字匹配
				incremental: false, // 增量搜索
			},
			commandLoading: false,
			commandList: [], // 指令列表
			commandSelect: [], // 下拉选择指令
			commandAll: false,
			commandInput: "",
		}
	},

	watch: {
		command(value) {
			if (value && this.socket && (!this.commandSessionId || this.sessionId == this.commandSessionId)) {
				this.socket.send('2' + value + "\r")
			}
		},
		commandText(value) {
			if (value && this.socket && (!this.commandSessionId || this.sessionId == this.commandSessionId)) {
				this.socket.send('2' + value)
			}
		},
	},
	computed: {
		...mapState({
			command: (state) => state.xterm.command,
			commandText: (state) => state.xterm.commandText,
			commandSessionId: (state) => state.xterm.sessionId,
		}),
	},
	methods: {
		// 获取sessionId
		getSessionId() {
			this.sessionIdLoading = true
			this.$http
				.post("/sessions?mode=naive&assetId=" + this.assetId)
				.then((res) => {
					this.sessionId = res.data.id
					this.sessionIdLoading = false
					this.updateSessionStatus()
					this.initXterm()
				})
				.catch(() => {
					this.sessionIdLoading = false
				})
		},
		// 注册sessionId
		updateSessionStatus() {
			this.$http.post(`/sessions/${this.sessionId}/connect`).then(() => {
				this.$emit("input", this.sessionId)
			})
		},
		initXterm() {
			this.$nextTick(() => {
				const term = new Terminal({
					fontFamily: 'monaco, Consolas, "Lucida Console", monospace',
					fontSize: 14,
					theme: {
						background: "rgb(40, 44, 52)",
					},
					rightClickSelectsWord: true,
				})
				this.fitAddon = new FitAddon()
				this.searchAddon = new SearchAddon()
				term.open(this.$refs.xterm)
				// 自适应插件
				term.loadAddon(this.fitAddon)
				// 搜索插件
				term.loadAddon(this.searchAddon)
				this.fitAddon.fit()
				term.focus()
				term.writeln("Trying to connect to the server ...")
				let wsUrl = window.localStorage.getItem("apiUrl").replace("http", "ws")
				const socket = new WebSocket(`${wsUrl}/ssh?X-Auth-Token=${localStorage.getItem("X-Auth-Token")}&cols=${term.cols}&rows=${term.rows}&sessionId=${this.sessionId}`)
				socket.onopen = () => {
					// 定时ping
					this.pingInterval && clearInterval(this.pingInterval)
					this.pingInterval = setInterval(() => {
						socket.send(4)
					}, 5000)
				}

				socket.onerror = () => {
					term.writeln("Failed to connect to server.")
				}
				socket.onclose = () => {
					term.writeln("Connection is closed.")
					if (this.pingInterval) {
						clearInterval(this.pingInterval)
					}
				}
				socket.onmessage = (e) => {
					let msg = e.data
					const type = msg.substring(0, 1)
					const data = msg.substring(1)
					switch (type) {
						case "connected":
							term.clear()
							this.updateSessionStatus()
							break
						case "2":
							term.write(data)
							break
						case "closed":
							term.writeln(`\x1B[1;3;31m${msg["content"]}\x1B[0m `)
							socket.close()
							break
						default:
							break
					}
				}
				// term.onSelectionChange(async () => {
				//     let selection = term.getSelection();
				//     this.setState({
				//         selection: selection
				//     })
				//     if (navigator.clipboard) {
				//         await navigator.clipboard.writeText(selection);
				//     }
				// })

				term.attachCustomKeyEventHandler((e) => {
					let mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
					if (!e[mod + "Key"]) {
						return true
					}
					if (e.key === "f" || e.key === "l") {
						return false
					}
					// if (e.ctrlKey && e.key === 'c' && this.state.selection) {
					//     return false;
					// }
					// return !(e.ctrlKey && e.key === 'v');
				})
				term.onData((data) => {
					console.log(data)
					if (socket !== undefined) {
						socket.send('2' + data)
					}
				})

				this.socket = socket
				this.term = term
			})
		},
		// 缩放
		onResize() {
			if (this.socket && this.socket.readyState == WebSocket.OPEN) {
				if (this.resizeT) {
					clearTimeout(this.resizeT)
				}
				this.resizeT = setTimeout(() => {
					this.fitAddon.fit()
					this.$nextTick(() => {
						this.socket.send(JSON.stringify({ type: "resize", content: JSON.stringify({ cols: this.term.cols, rows: this.term.rows }) }))
					})
				}, 200)
			}
		},
		// 搜索
		search(type) {
			if (type == "next") {
				this.searchAddon.findNext(this.keyword, this.searchOptions)
			} else {
				this.searchAddon.findPrevious(this.keyword, this.searchOptions)
			}
		},
		// 搜索关闭
		closeSearch() {
			this.showSearch = false
			this.term.focus()
		},
		// 注册快捷键 搜索  清屏
		handleKeydown(e) {
			let mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
			if (!e[mod + "Key"]) {
				return false
			}
			if (e.key == "f") {
				this.showSearch = true
				e.preventDefault()
				this.$nextTick(() => {
					this.$refs.keyword.focus()
				})
			}
			if (e.key == "l") {
				this.term.clear()
				e.preventDefault()
			}
		},
		addCommand() {
			console.log("1")
			window.open(window.localStorage.getItem("apiUrl") + "/#/dynamic-command")
		},
		getCommandList() {
			this.commandLoading = true
			this.$http
				.get("/commands/paging?pageIndex=1&pageSize=200")
				.then((res) => {
					this.commandList = res.data.items
				})
				.finally(() => {
					this.commandLoading = false
				})
		},
		setCommand(type) {
			let command = this["command" + type]
			if (!command) {
				return false
			}
			this.$store.dispatch("xterm/setCommand", "")
			this.$store.dispatch("xterm/setSessionId", this.commandAll ? "" : this.sessionId)
			this.$nextTick(() => {
				this.$store.dispatch("xterm/setCommand", command)
			})
			this["command" + type] = type == "Input" ? "" : []
		},
	},
	created() {
		this.getSessionId()
	},
	destroyed() {
		this.pingInterval && clearInterval(this.pingInterval)
		this.socket && this.socket.close()
	},
}
</script>

<style lang="scss">
.command-box {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 1;
	display: flex;
	.ant-form-item-control {
		line-height: 32px;
	}
	.ant-select {
		.ant-select-selection {
			background-color: #3c3c3c;
			border-color: transparent;
			color: #fff;
		}
		.ant-select-arrow {
			color: #fff;
		}
		.ant-select-selection__rendered {
			line-height: 30px;
		}
	}
	.ant-form-item:nth-child(2) {
		flex: 1;
		width: 0;
		.ant-form-item-control-wrapper {
			width: 100%;
		}
	}
	.ant-input {
		height: 32px;
		background-color: #3c3c3c;
		border-color: transparent;
		color: #fff;
	}
	.ant-switch {
		margin-top: 0;
		margin-bottom: 0;
		&:not(.ant-switch-checked) {
			background-color: #3c3c3c;
		}
	}
}
</style>
<style lang="scss" scoped>
.xterm-box {
	position: relative;
	::v-deep .xterm {
		padding-bottom: 32px;
	}
	.search-box {
		position: absolute;
		top: -4px;
		right: 4px;
		padding: 5px 5px;
		box-shadow: 0 2px 8px #000;
		background-color: #252526;
		z-index: 999;
		display: flex;
		color: #b6b7b7;
		::v-deep .ant-input {
			background-color: #3c3c3c;
			border-color: transparent;
			border-radius: 0;
			color: #ccc;
			height: 25px;
			margin-right: 5px;
			padding-right: 78px;
			&:focus,
			&:hover {
				box-shadow: unset;
				border-color: $--color-primary;
			}
			&-suffix {
				.anticon {
					color: #ccc;
					&.active {
						color: $--color-primary;
					}
				}
			}
		}
		.anticon {
			color: #b6b7b7;
			line-height: 25px;
			margin: 0 4px;
		}
	}
}
</style>