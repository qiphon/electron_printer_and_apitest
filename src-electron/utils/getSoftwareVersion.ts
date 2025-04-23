import packageJson from '../../package.json'

/** 为解决热更新后拿不到正确的软件版本问题 */
export const getSoftwareVersion = () => {
  return packageJson.version
}
