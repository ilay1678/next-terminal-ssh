import moment from 'moment';
export const PROTOCOL_COLORS = {
  'rdp': 'cyan',
  'ssh': 'blue',
  'telnet': 'geekblue',
  'vnc': 'purple'
}

export function differTime(start, end) {
  let duration = moment.duration(Math.abs(moment(end).diff(moment(start))))
  let array = ['days', 'hours', 'minutes', 'seconds']
  let local = ['天', '小时', '分钟', '秒']
  let time = ''
  array.forEach((item, index) => {

    if (duration.get(item)) {
      time += duration.get(item) + local[index]
    }
  })
  return time
}