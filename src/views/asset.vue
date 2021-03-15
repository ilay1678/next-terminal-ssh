<template>
	<div>
		<a-row align="middle">
			<a-col :span="20" key="1">
				<a-space>
					<a-input-search
						allow-clear
						placeholder="资产名称"
						v-model="queryParams.name"
						@search="loadTableData(null, 1)"
					></a-input-search>
					<a-input-search
						allow-clear
						placeholder="资产IP"
						v-model="queryParams.ip"
						@search="loadTableData(null, 1)"
					></a-input-search>
					<a-select
						v-model="queryParams.tags"
						show-search
						allow-clear
						:max-tag-count="3"
						:max-tag-text-length="2"
						mode="multiple"
						placeholder="资产标签"
						option-filter-prop="children"
						:filter-option="true"
						:style="{minWidth: '150px'}"
						@focus="getTags"
						@change="loadTableData(null, 1)"
					>
						<template v-for="tag in tags">
							<a-select-option :value="tag" v-if="tag != '-'" :key="tag">{{tag}}</a-select-option>
						</template>
					</a-select>
					<a-select
						v-model="queryParams.protocol"
						show-search
						allow-clear
						placeholder="资产协议"
						option-filter-prop="children"
						:style="{minWidth: '150px'}"
						@change="loadTableData(null, 1)"
					>
						<template v-for="protocol in protocolList">
							<a-select-option :value="protocol.value" :key="protocol.value">{{protocol.text}}</a-select-option>
						</template>
					</a-select>
					<a-tooltip title="重置查询">
						<a-button
							type
							icon="undo"
							@click="loadTableData({ 
									name: '',
									ip: '',
									tags: [],
									pageIndex: 1,
									pageSize: 10,
									protocol: ''
								} )"
						></a-button>
					</a-tooltip>
				</a-space>
			</a-col>
			<a-col :span="4" style="text-align: right" key="2">
				<a-space>
					<a-tooltip title="新增">
						<a-button type icon="plus" @click="modalVisible = true"></a-button>
					</a-tooltip>
					<a-tooltip title="刷新列表">
						<a-button type icon="sync" @click="loadTableData"></a-button>
					</a-tooltip>
					<a-tooltip title="批量删除">
						<a-popconfirm
							:title="`确定要删除选择的${selectedRowKeys.length}个项目吗？`"
							placement="bottomRight"
							:disabled="selectedRowKeys.length == 0 || delBtnLoading"
							@confirm="deletePost(selectedRowKeys)"
						>
							<a-button icon="delete" :disabled="selectedRowKeys.length == 0" :loading="delBtnLoading"></a-button>
						</a-popconfirm>
					</a-tooltip>
				</a-space>
			</a-col>
		</a-row>
		<a-table
			position="both"
			:pagination="{
        showSizeChanger: true,
        current: queryParams.pageIndex,
        pageSize: queryParams.pageSize,
        total: total,
        showTotal: total => `总计 ${total} 条`
      }"
			:columns="columns"
			rowKey="id"
			:loading="loading"
			:data-source="items"
			@change="handleTableChange"
			:row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
		>
			<span slot="protocol" slot-scope="protocol">
				<a-tag :color="PROTOCOL_COLORS[protocol]">{{protocol}}</a-tag>
			</span>
			<span slot="sharerCount" slot-scope="sharerCount">
				<a-button type="link">{{sharerCount}}</a-button>
			</span>
			<span slot="action" slot-scope="action, record">
				<a-button size="small" type="link" @click="$router.push('/ssh/' + record.id)">接入</a-button>
				<a-button size="small" type="link" @click="$router.push('/ssh/' + record.id)">编辑</a-button>
				<a-button size="small" type="link" @click="$router.push('/ssh/' + record.id)">复制</a-button>
				<a-button size="small" type="link" @click="$router.push('/ssh/' + record.id)">更换所有</a-button>
				<a-button size="small" type="link" @click="$router.push('/ssh/' + record.id)">更新授权</a-button>
				<a-popconfirm
					:title="`确定要删除${record.name}吗？`"
					placement="bottomRight"
					:disabled="delBtnLoading"
					@confirm="deletePost(record.id)"
				>
					<a-button size="small" type="link">删除</a-button>
				</a-popconfirm>
			</span>
		</a-table>
		<a-modal :width="1040" v-model="modalVisible" title="新建">
			<a-form-model
				:labelCol="{ span: 6 }"
				:wrapperCol="{ span: 18 }"
				:rules="assetRules"
				:model="asset"
			>
				<a-row>
					<a-col :span="13">
						<a-form-model-item prop="name" label="资产名称">
							<a-input v-model="asset.name" placeholder="资产名称"></a-input>
						</a-form-model-item>
						<a-form-model-item prop="ip" label="主机">
							<a-input v-model="asset.ip" placeholder="资产的主机名称或者IP地址"></a-input>
						</a-form-model-item>
						<a-form-model-item prop="protocol" label="接入协议">
							<a-radio-group v-model="asset.protocol" @change="handleProtocolChange">
								<template v-for="item in protocolList">
									<a-radio :key="item.value" :value="item.value">{{item.text}}</a-radio>
								</template>
							</a-radio-group>
						</a-form-model-item>
						<a-form-model-item prop="prot" label="端口号">
							<a-input-number v-model="asset.port" :min="1" :max="65535" placeholder="TCP端口"></a-input-number>
						</a-form-model-item>
						<template v-if="asset.protocol == 'kubernetes'">
							<a-form-model-item prop="namespace" label="命名空间">
								<a-input v-model="asset.namespace" placeholder="为空时默认使用default命名空间"></a-input>
							</a-form-model-item>
							<a-form-model-item prop="container" label="容器">
								<a-input v-model="asset.container" placeholder="为空时默认使用第一个容器"></a-input>
							</a-form-model-item>
						</template>
						<template v-else>
							<a-form-model-item label="账户类型" prop="accountType">
								<a-select v-model="asset.accountType" defaultValue="custom" default-value="custom">
									<a-select-option key="custom" value="custom">密码</a-select-option>
									<a-select-option key="private-key" v-if="asset.protocol == 'ssh'" value="private-key">密钥</a-select-option>
									<a-select-option key="credential" value="credential">授权凭证</a-select-option>
								</a-select>
							</a-form-model-item>
							<template v-if="asset.accountType == 'credential'">
								<a-form-model-item label="授权凭证" prop="credentialId">
									<a-select v-model="asset.credentialId"></a-select>
								</a-form-model-item>
							</template>
							<template v-else-if="asset.accountType == 'custom'">
								<a-form-model-item prop="username" label="授权账户">
									<a-input v-model="asset.username" placeholder="输入授权账户"></a-input>
								</a-form-model-item>
								<a-form-model-item prop="password" label="授权密码">
									<a-input type="password" v-model="asset.password" placeholder="输入授权密码"></a-input>
								</a-form-model-item>
							</template>
							<template v-else-if="asset.accountType == 'private-key'">
								<a-form-model-item prop="username" label="授权账户">
									<a-input v-model="asset.username" placeholder="输入授权账户"></a-input>
								</a-form-model-item>
								<a-form-model-item prop="privateKey" label="私钥">
									<a-input v-model="asset.privateKey" type="textarea" placeholder="私钥"></a-input>
								</a-form-model-item>
								<a-form-model-item prop="passphrase" label="授权密码">
									<a-input type="password" v-model="asset.passphrase" placeholder="输入授权密码"></a-input>
								</a-form-model-item>
							</template>
						</template>

						<a-form-model-item label="标签" prop="tags">
							<a-select v-model="asset.tags" mode="tags" placeholder="标签可以更加方便的检索资产"></a-select>
						</a-form-model-item>
						<a-form-model-item label="备注" prop="description">
							<a-input v-model="asset.description" type="textarea" placeholder="关于资产的一些信息您可以写在这里"></a-input>
						</a-form-model-item>
					</a-col>
					<a-col :span="11">
						<a-collapse :defaultActiveKey="['remote-app', '认证', 'VNC中继', '模式设置']">
							<a-collapse-panel header="Remote App" key="remote-app" v-if="asset.protocol === 'rdp'">
								<a-form-model-item prop="remote-app">
									<a-tooltip
										slot="label"
										title="指定在远程桌面上启动的RemoteApp。
如果您的远程桌面服务器支持该应用程序，则该应用程序(且仅该应用程序)对用户可见。

Windows需要对远程应用程序的名称使用特殊的符号。
远程应用程序的名称必须以两个竖条作为前缀。
例如，如果您已经在您的服务器上为notepad.exe创建了一个远程应用程序，并将其命名为“notepad”，则您将该参数设置为:“||notepad”。"
									>程序&nbsp;</a-tooltip>
									<a-input v-model="asset['remote-app']" placeholder="remote app"></a-input>
								</a-form-model-item>
								<a-form-model-item prop="remote-app-dir">
									<a-tooltip slot="label" title="remote app的工作目录，如果未配置remote app，此参数无效。">工作目录&nbsp;</a-tooltip>
									<a-input v-model="asset['remote-app-dir']" placeholder="remote app的工作目录"></a-input>
								</a-form-model-item>
								<a-form-model-item prop="remote-app-args">
									<a-tooltip slot="label" title="remote app的命令行参数，如果未配置remote app，此参数无效。">参数&nbsp;</a-tooltip>
									<a-input v-model="asset['remote-app-args']" placeholder="remote app的命令行参数"></a-input>
								</a-form-model-item>
							</a-collapse-panel>
							<template v-else-if="asset.protocol === 'ssh'">
								<a-collapse-panel header="模式设置" key="模式设置">
									<a-form-model-item pro="ssh-mode">
										<a-tooltip slot="label" title="guacd对部分SSH密钥支持不完善，当密钥类型为ED25519时请选择原生模式。">连接模式&nbsp;</a-tooltip>
										<a-select v-model="asset['ssh-mode']">
											<a-select-option :value="''">默认</a-select-option>
											<a-select-option value="guacd">guacd</a-select-option>
											<a-select-option value="naive">原生</a-select-option>
										</a-select>
									</a-form-model-item>
								</a-collapse-panel>
								<template v-if="asset['ssh-mode'] != 'naive'">
									<a-collapse-panel header="显示设置" key="显示设置">
										<a-form-model-item pro="color-scheme" label="配色方案">
											<a-select v-model="asset['color-scheme']">
												<a-select-option value>默认</a-select-option>
												<a-select-option value="gray-black">黑底灰字</a-select-option>
												<a-select-option value="green-black">黑底绿字</a-select-option>
												<a-select-option value="white-black">黑底白字</a-select-option>
												<a-select-option value="black-white">白底黑字</a-select-option>
											</a-select>
										</a-form-model-item>

										<a-form-model-item pro="font-name" label="字体名称">
											<a-input v-model="asset['font-name']" type="text" placeholder="为空时使用系统默认字体" />
										</a-form-model-item>

										<a-form-model-item pro="font-size" label="字体大小">
											<a-input
												v-model="asset['font-size']"
												type="number"
												placeholder="为空时使用系统默认字体大小"
												:min="8"
												:max="96"
											/>
										</a-form-model-item>
									</a-collapse-panel>
									<a-collapse-panel header="控制终端行为" key="控制终端行为">
										<a-form-model-item pro="backspace" label="退格键映射">
											<a-select v-model="asset['backspace']">
												<a-select-option value>默认</a-select-option>
												<a-select-option value="127">删除键(Ctrl-?)</a-select-option>
												<a-select-option value="8">退格键(Ctrl-H)</a-select-option>
											</a-select>
										</a-form-model-item>

										<a-form-model-item pro="terminal-type" label="终端类型">
											<a-select v-model="asset['terminal-type']">
												<a-select-option value>默认</a-select-option>
												<a-select-option value="ansi">ansi</a-select-option>
												<a-select-option value="linux">linux</a-select-option>
												<a-select-option value="vt100">vt100</a-select-option>
												<a-select-option value="vt220">vt220</a-select-option>
												<a-select-option value="xterm">xterm</a-select-option>
												<a-select-option value="xterm-256color">xterm-256color</a-select-option>
											</a-select>
										</a-form-model-item>
									</a-collapse-panel>
								</template>
							</template>
							<template v-else-if="asset.protocol === 'vnc'">
								<a-collapse-panel header="显示设置" key="显示设置">
									<a-form-model-item prop="color-depth" label="色彩深度" initialValue>
										<a-select v-model="asset['color-depth']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="16">低色（16位）</a-select-option>
											<a-select-option value="24">真彩（24位）</a-select-option>
											<a-select-option value="32">真彩（32位）</a-select-option>
											<a-select-option value="8">256色</a-select-option>
										</a-select>
									</a-form-model-item>

									<a-form-model-item prop="cursor" label="光标" initialValue>
										<a-select v-model="asset['cursor']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="local">本地</a-select-option>
											<a-select-option value="remote">远程</a-select-option>
										</a-select>
									</a-form-model-item>
								</a-collapse-panel>
								<a-collapse-panel header="VNC中继" key="VNC中继">
									<a-form-model-item prop="dest-host">
										<a-tooltip title="连接到VNC代理（例如UltraVNC Repeater）时要请求的目标主机。" slot="label">目标主机&nbsp;</a-tooltip>
										<a-input v-model="asset['dest-host']" placeholder="目标主机" />
									</a-form-model-item>
									<a-form-model-item prop="dest-port">
										<a-tooltip title="连接到VNC代理（例如UltraVNC Repeater）时要请求的目标端口。" slot="label">目标端口&nbsp;</a-tooltip>
										<a-input
											v-model="asset['dest-host']"
											type="number"
											:min="1"
											:max="65535"
											placeholder="目标端口"
										/>
									</a-form-model-item>
								</a-collapse-panel>
							</template>
							<template v-else-if="asset.protocol === 'telnet'">
								<a-collapse-panel header="认证" key="认证">
									<a-form-model-item prop="username-regex" label="用户名正则表达式">
										<a-input v-model="asset['username-regex']" type="text" placeholder />
									</a-form-model-item>
									<a-form-model-item prop="password-regex" label="密码正则表达式">
										<a-input v-model="asset['password-regex']" type="text" placeholder />
									</a-form-model-item>
									<a-form-model-item prop="login-success-regex" label="登录成功正则表达式">
										<a-input v-model="asset['login-success-regex']" type="text" placeholder />
									</a-form-model-item>
									<a-form-model-item prop="login-failure-regex" label="登录失败正则表达式">
										<a-input v-model="asset['login-failure-regex']" type="text" placeholder />
									</a-form-model-item>
								</a-collapse-panel>
								<a-collapse-panel header="显示设置" key="显示设置">
									<a-form-model-item prop="color-scheme" label="配色方案" initialValue>
										<a-select v-model="asset['color-scheme']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="gray-black">黑底灰字</a-select-option>
											<a-select-option value="green-black">黑底绿字</a-select-option>
											<a-select-option value="white-black">黑底白字</a-select-option>
											<a-select-option value="black-white">白底黑字</a-select-option>
										</a-select>
									</a-form-model-item>

									<a-form-model-item prop="font-name" label="字体名称">
										<a-input v-model="asset['font-name']" type="text" placeholder="为空时使用系统默认字体" />
									</a-form-model-item>

									<a-form-model-item prop="font-size" label="字体大小">
										<a-input
											v-model="asset['font-size']"
											type="number"
											placeholder="为空时使用系统默认字体大小"
											:min="8"
											:max="96"
										/>
									</a-form-model-item>
								</a-collapse-panel>
								<a-collapse-panel header="控制终端行为" key="控制终端行为">
									<a-form-model-item prop="backspace" label="退格键映射" initialValue>
										<a-select v-model="asset['backspace']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="127">删除键(Ctrl-?)</a-select-option>
											<a-select-option value="8">退格键(Ctrl-H)</a-select-option>
										</a-select>
									</a-form-model-item>

									<a-form-model-item prop="terminal-type" label="终端类型" initialValue>
										<a-select v-model="asset['terminal-type']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="ansi">ansi</a-select-option>
											<a-select-option value="linux">linux</a-select-option>
											<a-select-option value="vt100">vt100</a-select-option>
											<a-select-option value="vt220">vt220</a-select-option>
											<a-select-option value="xterm">xterm</a-select-option>
											<a-select-option value="xterm-256color">xterm-256color</a-select-option>
										</a-select>
									</a-form-model-item>
								</a-collapse-panel>
							</template>
							<template v-else-if="asset.protocol === 'kubernetes'">
								<a-collapse-panel header="认证" key="认证">
									<a-form-model-item prop="use-ssl" label="使用SSL">
										<a-switch v-model="asset['use-ssl']" checkedChildren="是" unCheckedChildren="否" />
									</a-form-model-item>

									<template v-if="asset['use-ssl']">
										<a-form-model-item prop="client-cert" label="client-cert">
											<a-input v-model="asset['client-cert']" type="text" placeholder />
										</a-form-model-item>

										<a-form-model-item prop="client-key" label="client-key">
											<a-input v-model="asset['client-key']" type="text" placeholder />
										</a-form-model-item>

										<a-form-model-item prop="ca-cert" label="ca-cert">
											<a-input v-model="asset['ca-cert']" type="text" placeholder />
										</a-form-model-item>
									</template>

									<a-form-model-item prop="ignore-cert" label="忽略证书">
										<a-switch v-model="asset['ignore-cert']" checkedChildren="是" unCheckedChildren="否" />
									</a-form-model-item>
								</a-collapse-panel>
								<a-collapse-panel header="显示设置" key="显示设置">
									<a-form-model-item prop="color-scheme" label="配色方案" initialValue>
										<a-select v-model="asset['color-scheme']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="gray-black">黑底灰字</a-select-option>
											<a-select-option value="green-black">黑底绿字</a-select-option>
											<a-select-option value="white-black">黑底白字</a-select-option>
											<a-select-option value="black-white">白底黑字</a-select-option>
										</a-select>
									</a-form-model-item>

									<a-form-model-item prop="font-name" label="字体名称">
										<a-input v-model="asset['font-name']" type="text" placeholder="为空时使用系统默认字体" />
									</a-form-model-item>

									<a-form-model-item prop="font-size" label="字体大小">
										<a-input
											v-model="asset['font-size']"
											type="number"
											placeholder="为空时使用系统默认字体大小"
											:min="8"
											:max="96"
										/>
									</a-form-model-item>
								</a-collapse-panel>
								<a-collapse-panel header="控制终端行为" key="控制终端行为">
									<a-form-model-item prop="backspace" label="退格键映射" initialValue>
										<a-select v-model="asset['backspace']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="127">删除键(Ctrl-?)</a-select-option>
											<a-select-option value="8">退格键(Ctrl-H)</a-select-option>
										</a-select>
									</a-form-model-item>

									<a-form-model-item prop="terminal-type" label="终端类型" initialValue>
										<a-select v-model="asset['terminal-type']">
											<a-select-option value>默认</a-select-option>
											<a-select-option value="ansi">ansi</a-select-option>
											<a-select-option value="linux">linux</a-select-option>
											<a-select-option value="vt100">vt100</a-select-option>
											<a-select-option value="vt220">vt220</a-select-option>
											<a-select-option value="xterm">xterm</a-select-option>
											<a-select-option value="xterm-256color">xterm-256color</a-select-option>
										</a-select>
									</a-form-model-item>
								</a-collapse-panel>
							</template>
						</a-collapse>
					</a-col>
				</a-row>
			</a-form-model>
		</a-modal>
	</div>
</template>

<script>
import moment from "moment"
import { PROTOCOL_COLORS } from "@/utils/util"
export default {
	name: "asset",
	data() {
		const protocolList = [
			{ text: "RDP", value: "rdp" },
			{ text: "SSH", value: "ssh" },
			{ text: "VNC", value: "vnc" },
			{ text: "Telnet", value: "telnet" },
			{ text: "Kubernetes", value: "kubernetes" },
		]
		const columns = [
			{
				title: "序号",
				dataIndex: "id",
				key: "id",
				width: 80,
				customRender(text, record, index) {
					return index + 1
				},
			},
			{
				title: "资产名称",
				dataIndex: "name",
				key: "name",
				customRender: (name) => {
					let short = name
					if (short && short.length > 20) {
						short = short.substring(0, 20) + " ..."
					}
					return (
						<aTooltip placement="topLeft" title={name}>
							{short}
						</aTooltip>
					)
				},
				sorter: true,
			},
			{
				title: "连接协议",
				dataIndex: "protocol",
				key: "protocol",
				width: 120,
				align: "center",
				customRender: (protocol, record) => {
					const title = `${record["ip"] + ":" + record["port"]}`
					return (
						<a-tooltip title={title}>
							<a-tag color={PROTOCOL_COLORS[protocol]}>{protocol}</a-tag>
						</a-tooltip>
					)
				},
				filterMultiple: false,
				filters: protocolList,
			},
			{
				title: "标签",
				dataIndex: "tags",
				key: "tags",
				align: "center",
				customRender: (tags) => {
					let tagDocuments = []
					let tagArr = tags.split(",")
					for (let i = 0; i < tagArr.length; i++) {
						if (tags[i] === "-") {
							continue
						}
						tagDocuments.push(<a-tag key={tagArr[i]}>{tagArr[i]}</a-tag>)
					}
					return tagDocuments
				},
				scopedSlots: { customRender: "tags" },
			},
			{
				title: "状态",
				dataIndex: "active",
				key: "active",
				align: "center",
				width: 100,
				customRender: (text) => {
					if (text) {
						return (
							<aTooltip title="运行中">
								<aBadge status="processing" />
							</aTooltip>
						)
					} else {
						return (
							<aTooltip title="不可用">
								<aBadge status="error" />
							</aTooltip>
						)
					}
				},
			},
			{
				title: "所有者",
				dataIndex: "ownerName",
				key: "ownerName",
				align: "center",
			},
			{
				title: "授权人数",
				dataIndex: "sharerCount",
				key: "sharerCount",
				width: 100,
				align: "center",
				scopedSlots: {
					customRender: "sharerCount",
				},
			},
			{
				title: "创建日期",
				dataIndex: "created",
				key: "created",
				width: 150,
				align: "center",
				customRender: (created) => {
					return <a-tooltip title={created}>{moment(created).fromNow()}</a-tooltip>
				},
				sorter: true,
			},
			{
				title: "操作",
				key: "action",
				align: "right",
				width: 360,
				scopedSlots: {
					customRender: "action",
				},
			},
		]
		return {
			PROTOCOL_COLORS,
			columns,
			items: [],
			total: 0,
			queryParams: {
				name: "",
				ip: "",
				tags: [],
				pageIndex: 1,
				pageSize: 10,
				protocol: "",
			},
			asset: {
				protocol: "ssh",
				accountType: "custom",
				port: "",
				name: "",
				ip: "",
				"ssh-mode": "",
				"color-scheme": "",
				backspace: "",
				"terminal-type": "",
				username: "",
				password: "",
				tags: [],
				description: "",
				"color-depth": "",
				cursor: "",
				"dest-host": "",
				"remote-app": "",
				"remote-app-dir": "",
				"remote-app-args": "",
				"font-name": "",
				"font-size": "",
				"username-regex": "",
				"password-regex": "",
				"login-failure-regex": "",
				"login-success-regex": "",
				"use-ssl": false,
				"client-cert": "",
				"client-key": "",
				"ca-cert": "",
				"ignore-cert": false,
				namespace: "123",
				container: "1231",
			},
			assetRules: {
				name: [{ required: true, message: "请输入资产名称" }],
				ip: [{ required: true, message: "请输入资产的主机名称或者IP地址" }],
				protocol: [{ required: true, message: "请选择接入协议" }],
				port: [{ required: true, message: "请输入资产端口" }],
				pod: [{ required: true, message: "请输入Pod名称" }],
				accountType: [{ required: true, message: "请选择接账户类型" }],
				credentialId: [{ required: true, message: "请选择授权凭证" }],
				privateKey: [{ required: true, message: "请输入私钥" }],
			},
			loading: false,
			modalVisible: false,
			modalTitle: "",
			modalConfirmLoading: false,
			credentials: [],
			tags: [],
			protocolList,
			model: {},
			selectedRowKeys: [],
			delBtnLoading: false,
			changeOwnerModalVisible: false,
			changeSharerModalVisible: false,
			changeOwnerConfirmLoading: false,
			changeSharerConfirmLoading: false,
			users: [],
			selected: {},
			selectedSharers: [],
		}
	},
	methods: {
		getTags() {
			this.$http.get("/tags").then((res) => {
				this.tags = res.data
			})
		},
		loadTableData(queryParams, pageIndex) {
			if (queryParams) {
				this.queryParams = Object.assign(this.queryParams, queryParams, { pageIndex: pageIndex || this.queryParams.pageIndex })
			}
			this.loading = true
			this.$http
				.get("/assets/paging", { params: { ...this.queryParams, tags: this.queryParams.tags.length ? this.queryParams.tags.join(",") : undefined } })
				.then((res) => {
					this.items = res.data.items
					this.total = res.data.total
				})
				.finally(() => {
					this.loading = false
				})
		},
		onSelectChange(selectedRowKeys) {
			this.selectedRowKeys = selectedRowKeys
		},
		deletePost(ids) {
			if (typeof ids === "string") {
				ids = [ids]
			}
			if (!ids.length) {
				return false
			}
			this.delBtnLoading = true
			this.$http.delete("/assets/" + ids.join(",")).then(() => {
				this.$message.success("删除成功")
				this.delBtnLoading = false
				this.loadTableData()
			})
		},
		handleTableChange(pagination, filters, sorter) {
			for (let i in filters) {
				filters[i] = filters[i][0] || undefined
			}
			let query = {
				...this.queryParams,
				...filters,
				pageIndex: pagination.current,
				pageSize: pagination.pageSize,
				order: sorter.order,
				field: sorter.field,
			}

			this.loadTableData(query)
		},
		handleProtocolChange() {
			this.asset.accountType = "custom"
			switch (this.asset.protocol) {
				case "rdp":
					this.asset.port = 3389
					break
				case "ssh":
					this.asset.port = 22
					break
				case "vnc":
					this.asset.port = 5900
					break
				case "telnet":
					this.asset.port = 23
					break
				case "kubernetes":
					this.asset.port = 6443
					break
			}
		},
	},
	created() {
		this.loadTableData()
	},
}
</script>

<style>
</style>