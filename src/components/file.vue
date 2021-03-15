<template>
	<div
		class="file-box"
		@contextmenu="(event) => handleContextmenu(event, 'div')"
		v-resize
		@resize="onResize"
	>
		<a-input placeholder="input search text" @pressEnter="dir = dirTemp" v-model="dirTemp">
			<a-icon type="arrow-up" slot="addonBefore" @click="goUp" />
			<template slot="addonAfter">
				<a-icon type="reload" v-if="!upLoading" @click="getList" />
				<a-progress
					type="circle"
					v-else
					:percent="upTip"
					:showInfo="false"
					:stroke-color="{
						'0%': '#108ee9',
						'100%': '#87d068',
					}"
					:strokeWidth="15"
					:width="18"
				/>
			</template>
		</a-input>
		<a-table
			rowKey="path"
			:data-source="data"
			:loading="{
				spinning: loading,
				tip: loadingTip
			}"
			:pagination="false"
			:scroll="{ ...fileSize }"
			size="small"
			:customRow="onRow"
			:rowSelection="{
				selectedRowKeys,
				onChange: onSelectChange,
				type: 'checkbox'
			}"
			v-if="!isFile"
		>
			<a-table-column key="name" title="名称" :sorter="(a, b) => a.name.localeCompare(b.name)">
				<template slot-scope="text">
					<a-icon type="folder-open" style="color: #AA844C;" v-if="text.isDir" />
					<a-icon type="file" v-else />
					{{text.name}}
				</template>
			</a-table-column>
			<a-table-column key="size" title="大小" :sorter="(a, b) => a.size - b.size">
				<template slot-scope="scope">{{scope.isDir ? '' : renderSize(scope.size)}}</template>
			</a-table-column>
			<a-table-column key="mode" title="属性" data-index="mode" />
			<a-table-column
				key="modTime"
				:width="200"
				title="修改时间"
				data-index="modTime"
				:sorter="(a, b) => a.modTime.localeCompare(b.modTime)"
			/>
		</a-table>
		<a-spin :spinning="loading" :tip="loadingTip" v-else>
			<div
				id="editor"
				@contextmenu="(event) => handleContextmenu(event, 'file')"
				:style="{height: (fileSize.y + 50) + 'px'}"
			></div>
		</a-spin>
		<a-menu
			mode="vertical"
			ref="contextmenu"
			class="ant-menu-contextmenu"
			v-show="menuVisible"
			:style="menuStyle"
			:selectable="false"
		>
			<template v-if="contextMenuActiveItem.path">
				<a-menu-item
					@click="dir = contextMenuActiveItem.path"
					key="in"
				>{{ contextMenuActiveItem.isDir || contextMenuActiveItem.isLink ? '进入' : '编辑'}}</a-menu-item>
				<a-menu-item
					@click="downSelect"
					v-if="selectedRowKeys.length > 1"
					key="downloadSelect"
				>下载 选中的({{selectedRowKeys.length}})</a-menu-item>
				<a-menu-item
					v-if="!contextMenuActiveItem.isDir && !contextMenuActiveItem.isLink"
					@click="downPost(contextMenuActiveItem.path)"
					key="download"
				>下载</a-menu-item>
				<a-menu-item
					@click="deletePost(selectedRowKeys)"
					v-if="selectedRowKeys.length > 1"
					key="delSelect"
				>删除 选中的({{selectedRowKeys.length}})</a-menu-item>
				<a-menu-item @click="deletePost(contextMenuActiveItem.path)" key="del">删除</a-menu-item>
				<a-menu-item
					@click="dialogType = '	';mkdir.dir = contextMenuActiveItem.name; mkdirVisible = true"
					key="rename"
				>重命名</a-menu-item>
				<a-menu-item
					v-if="isTar(contextMenuActiveItem.path)"
					@click="setCommand('tar -zxvf ' + contextMenuActiveItem.path)"
				>发送解压命令</a-menu-item>
			</template>
			<template v-if="!isFile">
				<a-menu-item key="upload">
					<a-upload
						name="file"
						:multiple="true"
						:disabled="upLoading"
						:showUploadList="false"
						:customRequest="(a) => {upPost(a.file)}"
					>{{!upLoading ? '上传文件' : ('上传中' + upTip + '%')}}</a-upload>
				</a-menu-item>
				<a-menu-item
					@click="dialogType = 'mkfile'; mkdir.dir = ''; mkdirVisible = true"
					key="mkfile"
				>新建文件</a-menu-item>

				<a-menu-item
					@click="dialogType = 'mkdir'; mkdir.dir = ''; mkdirVisible = true"
					key="mkdir"
				>新建文件夹</a-menu-item>
				<a-menu-item @click="selectAll" key="select">全选</a-menu-item>
			</template>
			<template v-else>
				<a-menu-item @click="downPost(dir)" key="download">下载</a-menu-item>
				<a-menu-item @click="saveFile" key="save">保存</a-menu-item>
			</template>
			<a-menu-item @click="getList" key="refresh">刷新</a-menu-item>
		</a-menu>
		<a-modal
			:visible="mkdirVisible"
			title="新建/修改 文件/文件夹"
			:confirm-loading="mkdirLoading"
			:mask-closable="false"
			centered
			@ok="handleDialogOk"
			@cancel="mkdirVisible = false"
		>
			<a-form-model ref="mkdirModel" labelAlign="left" :model="mkdir" :rules="mkdirRules">
				<a-form-model-item prop="dir">
					<a-input v-model="mkdir.dir" placeholder></a-input>
				</a-form-model-item>
			</a-form-model>
		</a-modal>
	</div>
</template>

<script>
import ace from "ace-builds/src-min-noconflict/ace.js"
import modelist from "ace-builds/src-min-noconflict/ext-modelist.js"
// import {themes} from "ace-builds/src-min-noconflict/ext-themelist.js"
import "ace-builds/webpack-resolver"
let path = require("path")

export default {
	props: {
		sessionId: String,
	},
	data() {
		return {
			selectedRowKeys: [],
			menuVisible: false,
			menuStyle: {
				position: "fixed",
				top: "0",
				left: "0",
				border: "1px solid #eee",
				zIndex: 9999,
			},
			// 当前目录
			dir: "/",
			dirTemp: "/",
			// 文件列表
			data: [],
			loading: false,
			loadingTip: "",
			// 目录信息 不一定存在
			dirInfo: {
				path: "",
			},
			isFile: false,
			// 文件内容
			fileContent: "",
			// 右键选中item
			contextMenuActiveItem: {},
			editor: "",
			fileSize: {
				y: 400,
			},
			dialogType: "dir",
			mkdirLoading: false,
			mkdirVisible: false,
			mkdir: {
				dir: "",
			},
			mkdirRules: {
				dir: [{ required: true, message: "请输入文件/文件夹名称", trigger: "blur" }],
			},
			upLoading: false,
			upTip: 0,
		}
	},
	watch: {
		dir() {
			this.isFile = false
			this.dirTemp = this.dir
			if (this.dir != this.dirInfo.path) {
				this.dirInfo = {}
			}
			if (this.dir == this.contextMenuActiveItem.path) {
				this.dirInfo = this.contextMenuActiveItem
			}
			this.getList()
		},
	},
	methods: {
		renderSize(value) {
			if (null == value || value === "" || value === 0) {
				return "0 B"
			}
			const unitArr = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
			let srcSize = parseFloat(value)
			let index = Math.floor(Math.log(srcSize) / Math.log(1024))
			let size = srcSize / Math.pow(1024, index)
			size = size.toFixed(2)
			return size + " " + unitArr[index]
		},
		// 缩放
		onResize(e) {
			this.fileSize.y = e.detail.height - 100
			this.editor && this.editor.resize()
		},
		// th事件
		onRow(item, index) {
			return {
				on: {
					// 单击选中
					click: (event) => {
						let mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
						let selectIndex = this.selectedRowKeys.indexOf(item.path)
						console.log(index)
						// to do shift 选择
						if (event[mod + "Key"]) {
							if (selectIndex > -1) {
								this.selectedRowKeys.splice(selectIndex, 1)
							} else {
								this.selectedRowKeys.push(item.path)
							}
							event.preventDefault()
						} else {
							this.selectedRowKeys = selectIndex > -1 ? [] : [item.path]
						}
					},
					// 双击进入
					dblclick: () => {
						this.isFile = false
						this.dir = item.path
						this.dirInfo = item
					},
					// 右键
					contextmenu: (event) => {
						event.preventDefault()
						event.stopPropagation()
						if (this.selectedRowKeys.indexOf(item.path) <= -1) {
							this.selectedRowKeys = [item.path]
						}
						this.contextMenuActiveItem = item
						this.handleContextmenu(event, "dir")
					},
					mouseenter: () => {}, // 鼠标移入行
					mouseleave: () => {},
				},
			}
		},
		// table选中事件
		onSelectChange(selectedRowKeys) {
			this.selectedRowKeys = selectedRowKeys
		},
		selectAll() {
			this.selectedRowKeys = []
			this.data.forEach((item) => {
				this.selectedRowKeys.push(item.path)
			})
		},
		// 右键事件
		handleContextmenu(event, type) {
			if (type != "dir") {
				this.contextMenuActiveItem = {}
			}
			event.preventDefault()
			this.menuVisible = true
			this.$nextTick(() => {
				let top = this.$refs.contextmenu.$el.offsetHeight + event.clientY > document.body.offsetHeight ? event.clientY - this.$refs.contextmenu.$el.offsetHeight : event.clientY
				let left = this.$refs.contextmenu.$el.offsetWidth + event.clientX > document.body.offsetWidth ? event.clientX - this.$refs.contextmenu.$el.offsetWidth : event.clientX
				this.menuStyle.top = top + "px"
				this.menuStyle.left = left + "px"
			})
			document.body.addEventListener("click", this.bodyClick)
		},
		// 返回上一级
		goUp() {
			this.dir = path.resolve(this.dir, "..")
			this.isFile = false
		},
		// 获取文件列表
		getList() {
			// 判断是文件
			if (this.isFile || (this.dirInfo.path && !this.dirInfo.isDir && !this.dirInfo.isLink)) {
				this.getContent()
				return false
			}
			this.loading = true
			this.$http
				.get("/sessions/" + this.sessionId + "/ls", {
					params: {
						dir: this.dir,
					},
				})
				.then((res) => {
					this.loading = false
					this.data = res.data
				})
				.catch(() => {
					this.loading = false
					if (!this.dirInfo.isLink) {
						this.getContent()
					}
				})
		},
		// 获取文件内容
		getContent() {
			this.loading = true
			this.$http
				.get("/sessions/" + this.sessionId + "/download", {
					params: {
						file: this.dir,
					},
					responseType: "blob",
				})
				.then(async (res) => {
					let textdata = await res.text()
					let jsondata = {}
					try {
						jsondata = JSON.parse(textdata)
					} catch (error) {
						console.log(error)
					}
					this.data = []
					this.loading = false
					if (jsondata && jsondata.code == 0) {
						this.$message.error(jsondata.message)
					} else {
						this.isFile = true
						this.fileContent = textdata
						this.initAce()
					}
				})
				.finally(() => {
					this.loading = false
				})
		},
		// 初始化编辑器
		initAce() {
			this.editor.destroy && this.editor.destroy()
			this.$nextTick(() => {
				this.editor = ace.edit("editor", {
					value: this.fileContent || "",
					autoScrollEditorIntoView: true,
					showPrintMargin: false,
					readOnly: false,
					theme: "ace/theme/monokai",
					mode: modelist.getModeForPath(this.dir).mode,
					wrap: true,
					fontSize: 14,
				})
				this.editor.commands.addCommand({
					name: "saveCommand",
					bindKey: {
						win: "Ctrl-S",
						mac: "Command-S",
					},
					exec: () => {
						this.saveFile()
					},
					readOnly: true,
				})
				this.editor.resize()
			})
		},
		// 调用上传文件接口保存文件
		saveFile() {
			let postBlob = new Blob([this.editor.getValue()])
			let postFile = new File([postBlob], path.basename(this.dir))

			this.upPost(postFile, path.dirname(this.dir))
		},
		handleDialogOk() {
			this.$refs.mkdirModel.validate((valid) => {
				if (valid) {
					this.mkdirLoading = true
					if (this.dialogType == "mkdir") {
						this.mkdirPost()
					} else if (this.dialogType == "rename") {
						this.renamePost()
					} else if (this.dialogType == "mkfile") {
						let postBlob = new Blob([])
						let postFile = new File([postBlob], this.mkdir.dir)
						this.upPost(postFile)
					}
				}
			})
		},
		// 新建文件夹提交
		mkdirPost() {
			this.$refs.mkdirModel.validate((valid) => {
				if (valid) {
					this.mkdirLoading = true
					this.$http
						.post(
							`sessions/${this.sessionId}/mkdir`,
							{
								dir: path.join(this.dir, this.mkdir.dir),
							},
							{
								params: {
									dir: path.join(this.dir, this.mkdir.dir),
								},
							}
						)
						.then(() => {
							this.$message.success("创建成功")
							this.mkdirVisible = false
							this.getList()
						})
						.finally(() => {
							this.mkdirLoading = false
						})
				}
			})
		},
		// 重命名提交
		renamePost() {
			this.$http
				.post(
					`/sessions/${this.sessionId}/rename`,
					{},
					{
						params: {
							oldName: this.contextMenuActiveItem.path,
							newName: path.join(this.contextMenuActiveItem.path, "../" + this.mkdir.dir),
						},
					}
				)
				.then(() => {
					this.$message.success("修改成功")
					this.mkdirVisible = false
					this.getList()
				})
				.finally(() => {
					this.mkdirLoading = false
				})
		},
		// 上传文件提交
		upPost(postFile, dir) {
			let formData = new FormData()
			formData.append("file", postFile)
			this.upLoading = true
			return this.$http
				.post("/sessions/" + this.sessionId + "/upload?dir=" + (dir || this.dir), formData, {
					onUploadProgress: (progressEvent) => {
						console.log(progressEvent)
						let percent = ((progressEvent.loaded / progressEvent.total) * 100) | 0
						this.upTip = percent
					},
				})
				.then(() => {
					this.$message.success("上传保存成功")
					if (!this.isFile && this.dialogType != "mkfile") {
						this.getList()
					} else if (this.dialogType == "mkfile") {
						// 进入新建文件
						this.mkdirLoading = false
						this.mkdirVisible = false
						this.dir = path.join(this.dir, this.mkdir.dir)
						this.dialogType = ""
					}
				})
				.finally(() => {
					this.upLoading = false
					this.upTip = 0
				})
		},
		// 下载选中
		downSelect() {
			for (let i in this.selectedRowKeys) {
				this.downPost(this.selectedRowKeys[i])
			}
		},
		// 下载文件提交
		downPost(dir) {
			// todo js 打包下载
			let iframe = document.createElement("iframe")
			iframe.style.display = "none"
			iframe.style.height = 0
			iframe.src = window.localStorage.getItem("apiUrl") + "/sessions/" + this.sessionId + "/download?file=" + dir
			document.body.appendChild(iframe)
		},
		// 删除提交
		deletePost(list) {
			if (typeof list === "string") {
				list = [list]
			}
			if (!list.length) {
				return false
			}
			let title = ""
			if (list.length === 1) {
				let file = path.basename(list[0])
				title = `您确认要删除"${file}"吗？`
			} else {
				title = `您确认要删除所选的${list.length}项目吗？`
			}
			this.$confirm({
				title,
				content: "所选项目将立即被删除",
				confirmLoading: this.mkdirLoading,
				onOk: () => {
					this.mkdirLoading = true
					let successCount = []
					let errorCount = []
					for (let i in list) {
						this.$http
							.post(`/sessions/${this.sessionId}/rm`, null, {
								params: {
									key: list[i],
								},
							})
							.then(() => {
								successCount.push(list[i])
							})
							.catch(() => {
								errorCount.push(list[i])
							})
							.finally(() => {
								if (successCount.length + errorCount.length == list.length) {
									this.$message.success("删除成功" + successCount.length + "个文件" + (errorCount.length > 0 ? ", 失败" + errorCount.length + "个文件" : ""))
									this.mkdirLoading = false
									this.getList()
									this.selectedRowKeys = []
								}
							})
					}
				},
				onCancel() {},
			})
		},
		isTar(dir) {
			return 	path.extname(dir) == 'gz'
		},
		setCommand(command) {
			if (!command) {
				return false
			}
			this.$store.dispatch("xterm/setCommandText", "")
			this.$store.dispatch("xterm/setSessionId", this.sessionId)
			this.$nextTick(() => {
				this.$store.dispatch("xterm/setCommandText", command)
			})
		},
		bodyClick() {
			this.menuVisible = false
			document.body.removeEventListener("click", this.bodyClick)
		},
	},
	mounted() {
		this.loading = true
		this.getList()
	},

	beforeDestroy() {
		this.editor.destroy && this.editor.destroy()
	},
}
</script>

<style lang="scss" scoped>
.file-box {
	width: 100%;
	padding: 8px;
	::v-deep .ant-input {
		background-color: #3c3c3c;
		border-color: transparent;
		color: #fff;
	}
	::v-deep .ant-input-group-addon {
		background-color: $--background-color-base;
		color: $--color-base;
		border-radius: 0;
		border-color: transparent;
	}
}
::v-deep .ant-table {
	border-color: transparent;
	&-header {
		overflow-x: hidden !important;
		margin-bottom: 0 !important;
	}
	tr,
	td,
	th {
		border-bottom: 0 !important;
	}
	th {
		color: $--color-base;
	}
	&-body {
		background-color: transparent !important;
		border-radius: 0;
		color: $--color-base;
	}
}
::v-deep .ant-table-tbody > tr.ant-table-row-selected td {
	background-color: $--background-color-base;
}
::v-deep .ant-table-tbody > tr:hover:not(.ant-table-expanded-row):not(.ant-table-row-selected) > td {
	background-color: $--background-color-base;
}
.ant-spin-nested-loading {
	height: 100%;
	::v-deep > .ant-spin-container {
		height: 100%;
	}
}
</style>
