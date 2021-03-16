export default {
  namespaced: true,
  state: {
    visitedRoutes: [],
  },
  mutations: {
    addVisitedRoute(state, route) {
      let target = state.visitedRoutes.find((item) => item.fullPath == route.fullPath)
      if (!target) {
        state.visitedRoutes.push(route)
      }
    },
    deleteVisitedRoute(state, route) {
      state.visitedRoutes.forEach((item, index) => {
        if (item.fullPath == route || item.fullPath == route.fullPath) {
          state.visitedRoutes.splice(index, 1)
        }
      })
    },
    updateVisitedRoute(state, route) {
      state.visitedRoutes.forEach(item => {
        if (item.fullPath == route.fullPath) {
          item = Object.assign(item, route)
        }
      });
    }
  },
  actions: {
    addVisitedRoute({ commit }, route) {
      console.log(route)
      commit('addVisitedRoute', { ...route, title: (route.query && route.query.name) || (route.params && route.params.name) || route.title || route.meta.title || route.name || '' })
    },
    deleteVisitedRoute({ commit, state }, route) {
      return new Promise(resolve => {
        commit('deleteVisitedRoute', route)
        resolve(state.visitedRoutes)
      })
    },
    updateVisitedRoute({ commit }, route) {
      commit('updateVisitedRoute', route)
    }
  }
}