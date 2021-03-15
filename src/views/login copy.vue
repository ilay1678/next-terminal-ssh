<template>
	<div>
		<a-form-model
			ref="form"
			:labelCol="{ span: 4 }"
			:wrapperCol="{ span: 14 }"
			labelAlign="left"
			:model="form"
			:rules="rules"
		>
			<a-form-model-item label="用户名" prop="username">
				<a-input v-model="form.username" placeholder="Username">
					<a-icon slot="prefix" type="user" style="color:rgba(0,0,0,.25)" />
				</a-input>
			</a-form-model-item>
			<a-form-model-item label="密码" prop="password">
				<a-input v-model="form.password" type="password" placeholder="Password">
					<a-icon slot="prefix" type="lock" style="color:rgba(0,0,0,.25)" />
				</a-input>
			</a-form-model-item>
			<a-form-model-item :wrapper-col="{ span: 14, offset: 4 }">
				<a-button @click="submitForm" :loading="loginLoading" type="primary">登陆</a-button>
			</a-form-model-item>
		</a-form-model>
		<a-modal
			:visible="totpModalVisible"
			title="双因素认证"
			:confirm-loading="confirmLoading"
			:mask-closable="false"
			centered
			@ok="handleOk"
			@cancel="handleCancel"
		>
			<a-form-model ref="totpForm" labelAlign="left" :model="form" :rules="rules">
				<a-form-model-item prop="totp">
					<a-input v-model="form.totp" placeholder="请输入双因素认证APP中显示的授权码">
						<a-icon slot="prefix" type="lock" style="color:rgba(0,0,0,.25)" />
					</a-input>
				</a-form-model-item>
			</a-form-model>
		</a-modal>
	</div>
</template>
<script>
export default {
	data() {
		return {
			form: {
				username: "demo",
				password: "demo",
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
		}
	},
	methods: {
		submitForm() {
			this.$refs.form.validate((valid) => {
				if (valid) {
					this.loginLoading = true
					this.$http
						.post("/login", this.form)
						.then((res) => {
							if (res.code === 0) {
								this.totpModalVisible = true
								return false
							} else if (res.code === 1) {
								this.loginSuccess(res)
							}
						})
						.catch(() => {
							this.loginLoading = false
						})
				} else {
					console.log(11)
				}
			})
		},
		handleOk() {
			this.$nextTick(() => {
				this.$refs.totpForm.validate((valid) => {
					if (valid) {
						this.confirmLoading = true
						this.$http
							.post("/loginWithTotp", this.form)
							.then((res) => {
								if (res.code === 1) {
									this.loginSuccess(res)
								}
							})
							.catch(() => {
								this.confirmLoading = false
								this.form.totp = ""
							})
					}
				})
			})
		},
		handleCancel() {
			this.totpModalVisible = false
			this.loginLoading = false
			this.form = {
				username: "",
				password: "",
				totp: "",
			}
		},
		loginSuccess(res) {
			localStorage.setItem("X-Auth-Token", res.data)
			this.$message.success('登陆成功')
			this.$router.push("/")
		},
	},
}
</script>
