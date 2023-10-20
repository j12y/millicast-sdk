import Logger from './Logger'
import PeerConnection from './PeerConnection'
import Signaling from './Signaling'
import Director from './Director'
import Publish from './Publish'
import View from './View'

// TODO: pull this during build from package.json
// const version = '0.1.41';
const version = '@npm_package_version'

export {
  Logger,
  PeerConnection,
  Signaling,
  Director,
  Publish,
  View,
  version
}
