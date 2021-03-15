<template>
	<div>
		<a-table
			position="both"
			:pagination="{
        showQuickJumper: true,
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
		>
			<span slot="protocol" slot-scope="protocol">
				<a-tag :color="PROTOCOL_COLORS[protocol]">{{protocol}}</a-tag>
			</span>
			<span slot="tags" slot-scope="tags">11231{{tags}}</span>
		</a-table>
	</div>
</template>

<script>
import { PROTOCOL_COLORS, differTime } from "@/utils/util"
import moment from "moment"
export default {
	name: "session",
	data() {
		const columns = [
			{
				title: "序号",
				dataIndex: "id",
				key: "id",
				customRender(text, record, index) {
					return index + 1
				},
			},
			{
				title: "来源IP",
				dataIndex: "clientIp",
				key: "clientIp",
			},
			{
				title: "用户昵称",
				dataIndex: "creatorName",
				key: "creatorName",
				filterMultiple: false,
				scopedSlots: {
					filterDropdown: "filterDropdown",
					filterIcon: "filterIcon",
					customRender: "customRender",
				},
			},
			{
				title: "资产名称",
				dataIndex: "assetName",
				key: "assetName",
				ellipsis: true,
				customRender: (assetName) => {
					return (
						<aTooltip placement="topLeft" title={assetName}>
							<span class="text-over">{assetName}</span>
						</aTooltip>
					)
				},
			},
			{
				title: "连接协议",
				dataIndex: "protocol",
				key: "protocol",
				customRender: (protocol, record) => {
					const title = `${record.username}@${record["ip"] + ":" + record["port"]}`
					return (
						<a-tooltip title={title}>
							<a-tag color={PROTOCOL_COLORS[protocol]}>{protocol}</a-tag>
						</a-tooltip>
					)
				},
				filterMultiple: false,
				filters: [
					{ text: "rdp", value: "rdp" },
					{ text: "ssh", value: "ssh" },
					{ text: "vnc", value: "vnc" },
					{ text: "telnet", value: "telnet" },
				],
			},
			{
				title: "接入时间",
				dataIndex: "connectedTime",
				key: "connectedTime",
				customRender: (connectedTime) => {
					return <a-tooltip title={connectedTime}>{moment(connectedTime).fromNow()}</a-tooltip>
				},
			},
			{
				title: "接入时长",
				dataIndex: "disconnectedTime",
				key: "disconnectedTime",
				customRender: (disconnectedTime, record) => {
					return <a-tooltip title={disconnectedTime}>{differTime(record.connectedTime, disconnectedTime)}</a-tooltip>
				},
			},
			{
				title: "操作",
				key: "action",
			},
		]
		return {
			PROTOCOL_COLORS,
			columns,
			items: [],
			total: 0,
			queryParams: {
				pageIndex: 1,
				pageSize: 10,
				protocol: "",
				userId: undefined,
				assetId: undefined,
				status: "disconnected",
			},
			loading: false,
			playbackVisible: false,
			playbackSessionId: null,
			videoPlayerVisible: false,
			videoPlayerSource: null,
			selectedRowKeys: [],
			delBtnLoading: false,
			users: [],
			assets: [],
			selectedRow: {},
		}
	},
	methods: {
		loadTableData(queryParams, pageIndex) {
			if (queryParams) {
				this.queryParams = Object.assign(this.queryParams, queryParams, { pageIndex: pageIndex || this.queryParams.pageIndex })
			}
			this.loading = true
			this.$http
				.get("/sessions/paging", { params: this.queryParams })
				.then((res) => {
					this.items = res.data.items
					this.total = res.data.total
				})
				.finally(() => {
					this.loading = false
				})
		},

		handleSearchByName(name) {
			let query = {
				...this.queryParams,
				pageIndex: 1,
				pageSize: this.queryParams.pageSize,
				name: name,
			}

			this.loadTableData(query)
		},

		handleSearchByIp(ip) {
			let query = {
				...this.queryParams,
				pageIndex: 1,
				pageSize: this.queryParams.pageSize,
				ip: ip,
			}

			this.loadTableData(query)
		},

		handleTagsChange(tags) {
			this.setState({
				selectedTags: tags,
			})
			let query = {
				...this.queryParams,
				pageIndex: 1,
				pageSize: this.queryParams.pageSize,
				tags: tags.join(","),
			}

			this.loadTableData(query)
		},

		handleSearchByProtocol(protocol) {
			let query = {
				...this.queryParams,
				pageIndex: 1,
				pageSize: this.queryParams.pageSize,
				protocol: protocol,
			}
			this.loadTableData(query)
		},
		handleTableChange(pagination, filters, sorter) {
			for(let i in filters) {
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
	},
	created() {
		this.loadTableData()
	},
}
</script>

<style>
</style>