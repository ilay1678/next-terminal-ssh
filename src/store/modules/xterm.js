export default {
  namespaced: true,
  state: {
    command: '',
    sessionId: '',
    commandText: ''
  },
  mutations: {
    setCommand(state, command) {
      state.command = command
    },
    setCommandText(state, command) {
      state.commandText = command
    },
    setSessionId(state, sessionId) {
      state.sessionId = sessionId
    }
  },
  actions: {
    setCommand({ commit }, command) {
      commit('setCommand', command)
    },
    setCommandText({ commit }, command) {
      commit('setCommandText', command)
    },
    setSessionId({ commit }, sessionId) {
      commit('setSessionId', sessionId)
    }
  }
}