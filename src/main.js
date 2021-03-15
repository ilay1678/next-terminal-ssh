import Vue from 'vue'
import Antd from 'ant-design-vue';
import App from './App.vue'
import 'ant-design-vue/dist/antd.css';
import './registerServiceWorker'
import router from './router'
import store from './store'
import $http from '@/utils/axios'
import '@/assets/scss/base.scss';

Vue.prototype.$http = $http

Vue.config.productionTip = false
Vue.use(Antd);

Vue.directive('resize', {
  bind: function (el, binding, vnode) {
    let elementResizeDetectorMaker = require("element-resize-detector")
    el.$$erd = elementResizeDetectorMaker({
      strategy: "scroll" //<- For ultra performance.
    })
    let options = {}
    if (binding.value && typeof binding.value === 'object') {
      options = binding.value
    }
    el.$$erd.listenTo(options, el, element => {
      let width = element.offsetWidth
      let height = element.offsetHeight
      if (vnode.componentInstance) {
        vnode.componentInstance.$emit('resize', { detail: { width, height } })
      } else {
        vnode.elm.dispatchEvent(
          new CustomEvent('resize', { detail: { width, height } })
        )
      }
    })
  },
  unbind(el) {
    if (el.$$erd) {
      el.$$erd.uninstall(el)
    }
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
