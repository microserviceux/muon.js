


export default class log {

  public static enabled = true

  static info(val: string) {
    if (log.enabled) {
      console.log(val)
    }
  }
  static err(val: string) {
    console.error(val)
  }
}
