<template>
	<div
		style="height: 100vh;"
		class="xterm-box"
		@keydown="handleKeydown"
		v-resize
		@resize="onResize"
		ref="xterm"
	></div>
</template>
<script>
import "xterm/css/xterm.css"
import { Terminal } from "xterm"
import { FitAddon } from "xterm-addon-fit"
export default {
	data() {
		return {
			step: "username",
			form: {
				username: "",
				password: "",
				totp: "",
			},
			rules: {
				username: [{ required: true, message: "请输入登录账号！", trigger: "blur" }],
				password: [{ required: true, message: "请输入登录密码！", trigger: "blur" }],
				totp: [{ required: true, message: "请输入双因素认证APP中显示的授权码", trigger: "blur" }],
			},
			loginLoading: false,
			totpModalVisible: false,
			confirmLoading: false,
			tempValue: "",
			term: null,
			fitAddon: null,
		}
	},
	methods: {
		loginSuccess(res) {
			localStorage.setItem("X-Auth-Token", res.data)
			this.$message.success("登陆成功")
			this.$router.push("/")
		},
		prompt(term) {
			term.write("\r\n$ ")
		},
		initXterm() {
			if (!window.localStorage.getItem("apiUrl")) {
				this.step = "apiUrl"
			}
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
				term.loadAddon(this.fitAddon)
				term.open(this.$refs.xterm)
				// 自适应插件
				this.fitAddon.fit()
				term.focus()
				term.prompt = () => {
					term.write("\r\n$ ")
				}
				term.writeln("欢迎进入Next Terminal ...")
				term.writeln("神奇的功能等待你去发现 ...")
				term.attachCustomKeyEventHandler((e) => {
					let mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
					if (!e[mod + "Key"]) {
						return true
					}
					if (e.key === "l") {
						return false
					}
				})
				this.prompt(term)
				term.write(this.step == "apiUrl" ? "请输入next-terminal后端地址" : "请输入用户名")
				this.prompt(term)

				term.onData((e) => {
					switch (e) {
						case "\r": // Enter
							console.log(1)
							this.prompt(term)
							this.nextStep()
							break
						case "\u0003": // Ctrl+C
							this.prompt(term)
							this.emptyValue()
							break
						case "\u007F": // Backspace (DEL)
							// Do not delete the prompt
							if (term._core.buffer.x > 2) {
								term.write("\b \b")
								this.delValue()
							}
							break
						default:
							// Print all other characters for demo
							if (this.loginLoading) {
								return false
							}
							this.writeValue(e)
							if (this.step == "password") {
								term.write("*")
							} else {
								term.write(e)
							}
					}
				})

				this.term = term
			})
		},

		onResize() {
			this.fitAddon.fit()
		},
		// 注册快捷键 搜索  清屏
		handleKeydown(e) {
			let mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
			if (!e[mod + "Key"]) {
				return false
			}
			if (e.key == "l") {
				window.localStorage.setItem("apiUrl", "")
				this.form = {
					username: "",
					password: "",
					totp: "",
				}
				this.step = "apiUrl"
				this.term.clear()
				this.term.write("1.请输入next-terminal后端地址 （CTRL + L 清空全部输入）")
				this.prompt(this.term)
				e.preventDefault()
			}
		},
		nextStep() {
			switch (this.step) {
				case "apiUrl":
					if (this.tempValue) {
						window.localStorage.setItem("apiUrl", this.tempValue)
						this.term.write("2.请输入用户名（CTRL + L 清空全部输入）")
						this.prompt(this.term)
						this.step = "username"
					} else {
						this.term.write("请输入next-terminal后端地址（CTRL + L 清空全部输入）")
						this.prompt(this.term)
					}
					break
				case "username":
					if (this.tempValue) {
						this.form.username = this.tempValue
						this.term.write("3.请输入密码（CTRL + L 清空全部输入）")
						this.prompt(this.term)
						this.step = "password"
					} else {
						this.term.write("请确认输入用户名（CTRL + L 清空全部输入）")
						this.prompt(this.term)
					}
					break
				case "password":
					if (this.tempValue) {
						this.form.password = this.tempValue
						this.loginLoading = true
						this.$http
							.post("/login", this.form)
							.then((res) => {
								if (res.code === 0) {
									this.loginLoading = false
									this.step = "totp"
									this.term.write("请输入双因素验证（CTRL + L 清空全部输入）")
									this.prompt(this.term)
									return false
								} else if (res.code === 1) {
									this.loginSuccess(res)
								}
							})
							.catch(() => {
								this.loginLoading = false
								this.term.write("4.请确认输入密码（CTRL + L 清空全部输入）")
								this.prompt(this.term)
							})
					} else {
						this.term.write("请确认输入密码（CTRL + L 清空全部输入）")
						this.prompt(this.term)
					}
					break
				case "totp":
					if (this.tempValue) {
						this.form.totp = this.tempValue
						this.loginLoading = true
						this.$http
							.post("/loginWithTotp", this.form)
							.then((res) => {
								if (res.code === 1) {
									this.loginSuccess(res)
								}
							})
							.catch(() => {
								this.loginLoading = false
								this.term.write("请确输入双因素验证（CTRL + L 清空全部输入）")
								this.prompt(this.term)
							})
					} else {
						this.term.write("请确输入双因素验证（CTRL + L 清空全部输入）")
						this.prompt(this.term)
					}
			}
			this.tempValue = ""
		},
		delValue() {
			this.tempValue = this.tempValue.substring(0, this.tempValue.length - 1)
		},
		writeValue(e) {
			this.tempValue += e
		},
		emptyValue() {
			this.tempValue = ""
		},
	},
	created() {
		this.initXterm()
	},
}
</script>
